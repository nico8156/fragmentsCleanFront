import {
	authMaybeRefreshRequested,
	authSessionExpired,
	authSessionLoaded,
	authSessionLoadFailed,
	authSessionLoadRequested,
	authSessionRefreshed,
	authSessionRefreshFailed,
	authSignedOut,
	authSignInFailed,
	authSignInRequested,
	authSignInSucceeded,
	authSignOutRequested,
	authUserHydrationFailed,
	authUserHydrationRequested,
	authUserHydrationSucceeded,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { toSessionSnapshot } from "@/app/core-logic/contextWL/userWl/utils/sessionSnapshot";
import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

const MINIMUM_TOKEN_TTL_MS = 60 * 1000; // 1 minute
const SIGN_IN_ERROR_MESSAGE = "Connexion Google impossible. Réessaie dans un instant.";

type AuthListenerDeps = {
	gateways: DependenciesWl["gateways"];
	helpers?: Partial<DependenciesWl["helpers"]>;
	onSessionChanged?: (session: AuthSession | undefined) => void;
};

const isHttp404 = (e: any): boolean => {
	const msg = String(e?.message ?? e ?? "");
	// on couvre plusieurs formats de message
	return (
		msg.includes("(404)") ||
		msg.includes(" 404") ||
		msg.toLowerCase().includes("status 404") ||
		msg.toLowerCase().includes("failed 404")
	);
};

const extractHttpStatus = (e: any): number | undefined => {
	if (typeof e?.status === "number") return e.status;
	const msg = String(e?.message ?? e ?? "");
	const match = msg.match(/\b(4\d\d|5\d\d)\b/);
	return match ? Number(match[1]) : undefined;
};

const isTransientRefreshFailure = (e: any): boolean => {
	const status = extractHttpStatus(e);
	if (status && (status === 408 || status === 429 || status >= 500)) return true;
	const msg = String(e?.message ?? e ?? "").toLowerCase();
	return (
		msg.includes("network") ||
		msg.includes("offline") ||
		msg.includes("timeout") ||
		msg.includes("timed out") ||
		msg.includes("abort") ||
		msg.includes("failed to fetch")
	);
};

export const authListenerFactory = (deps: AuthListenerDeps) => {
	const middleware = createListenerMiddleware();
	const listen =
		middleware.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

	let activeSession: AuthSession | undefined;

	const getSecureStore = () => deps.gateways?.auth?.secureStore;
	const getOAuthGateway = () => deps.gateways?.auth?.oauth;
	const getUserRepo = () => deps.gateways?.auth?.userRepo;
	const getAuthServer = () => deps.gateways?.auth?.server;

	listen({
		actionCreator: authSessionLoadRequested,
		effect: async (_action, api) => {
			try {
				const secureStore = getSecureStore();
				if (!secureStore) throw new Error("auth secure store unavailable");

				const stored = await secureStore.loadSession();
				if (!stored) {
					activeSession = undefined;
					deps.onSessionChanged?.(activeSession);
					api.dispatch(authSignedOut());
					return;
				}

				activeSession = stored;
				deps.onSessionChanged?.(activeSession);

				api.dispatch(authSessionLoaded({ session: toSessionSnapshot(stored) }));
				api.dispatch(authMaybeRefreshRequested());
				api.dispatch(authUserHydrationRequested({ userId: stored.userId }));
			} catch (error: any) {
				activeSession = undefined;
				deps.onSessionChanged?.(activeSession);
				api.dispatch(
					authSessionLoadFailed({
						error: error?.message ?? "Unable to load session",
					}),
				);
			}
		},
	});

	listen({
		actionCreator: authSignInRequested,
		effect: async (action, api) => {
			const oAuthGateway = getOAuthGateway();
			const secureStore = getSecureStore();
			const authServerGateway = getAuthServer();

			try {
				if (!oAuthGateway) throw new Error("oauth gateway unavailable");
				if (!secureStore) throw new Error("auth secure store unavailable");
				if (!authServerGateway) throw new Error("auth server gateway unavailable");

				// 1️⃣ Google Sign-In
				const { profile, authorization } =
					await oAuthGateway.startSignIn(action.payload.provider, {
						scopes: action.payload.scopes,
					});

				const { authorizationCode, codeVerifier, redirectUri, idToken } = authorization;

				if (!authorizationCode || !codeVerifier || !redirectUri) {
					throw new Error("Incomplete authorization result from provider");
				}

				// 2️⃣ Exchange backend
				const { session, user } = await authServerGateway.signInWithProvider({
					provider: profile.provider,
					authorizationCode,
					codeVerifier,
					redirectUri,
					idToken,
					scopes: action.payload.scopes ?? [],
				});

				// 3️⃣ persist
				activeSession = session;
				deps.onSessionChanged?.(activeSession);
				await secureStore.saveSession(session);

				// 4️⃣ store auth
				api.dispatch(
					authSignInSucceeded({
						session: toSessionSnapshot(session),
						profile: {
							provider: profile.provider,
							userId: session.userId,
						},
					}),
				);

				if (user) {
					api.dispatch(authUserHydrationSucceeded({ user }));
				} else {
					api.dispatch(authUserHydrationRequested({ userId: session.userId }));
				}

				api.dispatch(authMaybeRefreshRequested());
			} catch (error: any) {
				activeSession = undefined;
				api.dispatch(
					authSignInFailed({
						error: SIGN_IN_ERROR_MESSAGE,
					}),
				);
			}
		},
	});

	listen({
		actionCreator: authMaybeRefreshRequested,
		effect: async (_action, api) => {
			if (!activeSession) {
				return;
			}

			const { tokens } = activeSession;
			const now = Date.now();

			if (tokens.expiresAt - now > MINIMUM_TOKEN_TTL_MS) {
				return;
			}

			const authServer = getAuthServer();
			const secureStore = getSecureStore();

			if (!authServer) {
				api.dispatch(authSessionExpired({ reason: "Session expirée" }));
				return;
			}

			if (!secureStore) {
				api.dispatch(authSessionRefreshFailed({ error: "auth secure store unavailable" }));
				return;
			}

			try {
				const refreshed = await authServer.refreshSession(activeSession);

				activeSession = refreshed.session;
				deps.onSessionChanged?.(activeSession);
				await secureStore.saveSession(refreshed.session);

				api.dispatch(authSessionRefreshed({ session: toSessionSnapshot(refreshed.session) }));

				if (refreshed.user) {
					api.dispatch(authUserHydrationSucceeded({ user: refreshed.user }));
				}
			} catch (error: any) {
				const errorMessage = error?.message ?? "Session refresh failed";
				if (isTransientRefreshFailure(error)) {
					api.dispatch(
						authSessionRefreshFailed({
							error: errorMessage,
						}),
					);
					return;
				}

				activeSession = undefined;
				deps.onSessionChanged?.(activeSession);
				await secureStore.clearSession().catch(() => undefined);
				api.dispatch(
					authSessionRefreshFailed({
						error: errorMessage,
					}),
				);
				api.dispatch(authSignedOut());
			}
		},
	});

	listen({
		actionCreator: authUserHydrationRequested,
		effect: async (action, api) => {
			try {
				const repo = getUserRepo();
				if (!repo) throw new Error("user repo unavailable");

				const user = await repo.getById(action.payload.userId);

				// repo retourne null => 401 => session invalide
				if (!user) {
					api.dispatch(authSignedOut());
					return;
				}

				api.dispatch(authUserHydrationSucceeded({ user }));
			} catch (error: any) {
				// ✅ 404 => user pas encore provisionné côté backend => soft fail
				if (isHttp404(error)) {
					return;
				}

				api.dispatch(
					authUserHydrationFailed({
						error: error?.message ?? "Unable to load user",
					}),
				);
			}
		},
	});

	listen({
		actionCreator: authSignOutRequested,
		effect: async (_action, api) => {
			const oAuthGateway = getOAuthGateway();
			const secureStore = getSecureStore();
			const authServer = getAuthServer();

			const session = activeSession;

			try {
				if (session && authServer) {
					await authServer.logout(session);
				}

				if (session && oAuthGateway) {
					await oAuthGateway.signOut(session.provider);
				}
			} catch (e) {
				console.warn("[LOGOUT] error during remote logout", e);
			}

			activeSession = undefined;
			deps.onSessionChanged?.(activeSession);

			if (secureStore) {
				await secureStore.clearSession().catch(() => undefined);
			}

			api.dispatch(authSignedOut());
		},
	});

	return middleware.middleware;
};
