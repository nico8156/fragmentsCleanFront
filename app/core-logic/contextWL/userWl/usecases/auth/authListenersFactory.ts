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
				const { profile, tokens: providerTokens } =
					await oAuthGateway.startSignIn(action.payload.provider, {
						scopes: action.payload.scopes,
					});

				const authorizationCode = providerTokens.accessToken; // serverAuthCode
				const idToken = providerTokens.idToken;

				if (!authorizationCode) {
					throw new Error("No authorization code from provider");
				}

				// 2️⃣ Exchange backend
				const { session, user } = await authServerGateway.signInWithProvider({
					provider: profile.provider,
					authorizationCode,
					idToken,
					scopes: action.payload.scopes ?? [],
				});

				console.log("[AUTH] backend signInWithProvider returned session", {
					userId: (session as any)?.userId,
					accessTokenPrefix: (session as any)?.tokens?.accessToken?.slice?.(0, 20),
					hasRefresh: !!(session as any)?.tokens?.refreshToken,
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
						error: error?.message ?? "Sign-in failed",
					}),
				);
			}
		},
	});

	listen({
		actionCreator: authMaybeRefreshRequested,
		effect: async (_action, api) => {
			if (!activeSession) {
				console.log("[REFRESH] no activeSession, skipping");
				return;
			}

			const { tokens } = activeSession;
			const now = Date.now();
			console.log(
				"[REFRESH] now=",
				now,
				"expiresAt=",
				tokens.expiresAt,
				"delta=",
				tokens.expiresAt - now,
			);

			if (tokens.expiresAt - now > MINIMUM_TOKEN_TTL_MS) {
				console.log("[REFRESH] token still fresh, skipping");
				return;
			}

			const authServer = getAuthServer();
			const secureStore = getSecureStore();

			if (!authServer) {
				console.log("[REFRESH] no authServerGateway");
				api.dispatch(authSessionExpired({ reason: "Session expirée" }));
				return;
			}

			if (!secureStore) {
				console.log("[REFRESH] no secureStore");
				api.dispatch(authSessionRefreshFailed({ error: "auth secure store unavailable" }));
				return;
			}

			try {
				console.log(
					"[REFRESH] calling backend /auth/refresh with refreshToken=",
					activeSession.tokens.refreshToken,
				);

				const refreshed = await authServer.refreshSession(activeSession);
				console.log("[REFRESH] success, new accessToken=", refreshed.session.tokens.accessToken);

				activeSession = refreshed.session;
				deps.onSessionChanged?.(activeSession);
				await secureStore.saveSession(refreshed.session);

				api.dispatch(authSessionRefreshed({ session: toSessionSnapshot(refreshed.session) }));

				if (refreshed.user) {
					api.dispatch(authUserHydrationSucceeded({ user: refreshed.user }));
				}
			} catch (error: any) {
				console.log("[REFRESH] FAILED", error);
				activeSession = undefined;
				deps.onSessionChanged?.(activeSession);
				await secureStore.clearSession().catch(() => undefined);
				api.dispatch(
					authSessionRefreshFailed({
						error: error?.message ?? "Session refresh failed",
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
					console.log(
						"[AUTH] hydrate user: /auth/me returned 404 (profile not ready). Keeping session; will retry later.",
					);
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

