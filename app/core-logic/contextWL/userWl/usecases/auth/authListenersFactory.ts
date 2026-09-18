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
import { accountGeneration } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";

const MINIMUM_TOKEN_TTL_MS = 60 * 1000; // 1 minute
const SIGN_IN_ERROR_MESSAGE = "Connexion impossible. Réessaie dans un instant.";

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
	let epoch = 0;
	let refreshInFlight: { epoch: number; promise: Promise<void> } | undefined;
	let secureWrites: Promise<unknown> = Promise.resolve();
	const writeSecure = (operation: () => Promise<unknown>) => {
		secureWrites = secureWrites.catch(() => undefined).then(operation);
		return secureWrites;
	};

	const getSecureStore = () => deps.gateways?.auth?.secureStore;
	const getOAuthGateway = () => deps.gateways?.auth?.oauth;
	const getUserRepo = () => deps.gateways?.auth?.userRepo;
	const getAuthServer = () => deps.gateways?.auth?.server;

	listen({
		actionCreator: authSessionLoadRequested,
		effect: async (_action, api) => {
			const attempt = ++epoch;
			try {
				const secureStore = getSecureStore();
				if (!secureStore) throw new Error("auth secure store unavailable");

				await secureWrites.catch(() => undefined);
				if (attempt !== epoch) return;
				const stored = await secureStore.loadSession();
				if (attempt !== epoch) return;
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
				if (attempt !== epoch) return;
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
			const attempt = ++epoch;
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
				if (attempt !== epoch) return;

				if (!authorizationCode || (profile.provider === "google" && (!codeVerifier || !redirectUri))
						|| (profile.provider === "apple" && !idToken)) {
					throw new Error("Incomplete authorization result from provider");
				}

				// 2️⃣ Exchange backend
				const { session, user } = await authServerGateway.signInWithProvider({
					provider: profile.provider,
					authorizationCode,
					codeVerifier,
					redirectUri,
					idToken,
					displayName: profile.displayName,
					scopes: action.payload.scopes ?? [],
				});

				if (attempt !== epoch) return;
				await writeSecure(() => secureStore.saveSession(session));
				if (attempt !== epoch) return;
				activeSession = session;
				deps.onSessionChanged?.(activeSession);

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
				}
				// OAuth identity is only a provisional summary; the application profile owns the avatar.
				api.dispatch(authUserHydrationRequested({ userId: session.userId }));

				api.dispatch(authMaybeRefreshRequested());
			} catch {
				if (attempt !== epoch) return;
				activeSession = undefined;
				deps.onSessionChanged?.(activeSession);
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
			const refreshEpoch = epoch;
			if (refreshInFlight?.epoch === refreshEpoch) {
				await refreshInFlight.promise;
				return;
			}

			const refreshOperation = (async () => {
				const attempt = epoch;
				const sessionAtStart = activeSession;
				if (!activeSession) return;

				const { tokens } = activeSession;
				if (tokens.expiresAt - Date.now() > MINIMUM_TOKEN_TTL_MS) return;

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
					if (attempt !== epoch || activeSession !== sessionAtStart) return;
					await writeSecure(() => secureStore.saveSession(refreshed.session));
					if (attempt !== epoch || activeSession !== sessionAtStart) return;

					activeSession = refreshed.session;
					deps.onSessionChanged?.(activeSession);
					api.dispatch(authSessionRefreshed({ session: toSessionSnapshot(refreshed.session) }));

					if (refreshed.user) {
						api.dispatch(authUserHydrationSucceeded({ user: refreshed.user }));
					}
				} catch (error: any) {
					if (attempt !== epoch || activeSession !== sessionAtStart) return;
					const errorMessage = error?.message ?? "Session refresh failed";
					if (isTransientRefreshFailure(error)) {
						api.dispatch(authSessionRefreshFailed({ error: errorMessage }));
						return;
					}

					activeSession = undefined;
					deps.onSessionChanged?.(activeSession);
					await writeSecure(() => secureStore.clearSession()).catch(() => undefined);
					if (attempt !== epoch) return;
					api.dispatch(authSessionRefreshFailed({ error: errorMessage }));
					api.dispatch(authSignedOut());
				}
			})();
			refreshInFlight = { epoch: refreshEpoch, promise: refreshOperation };
			try {
				await refreshOperation;
			} finally {
				if (refreshInFlight?.promise === refreshOperation) refreshInFlight = undefined;
			}
		},
	});

	listen({
		actionCreator: authUserHydrationRequested,
		effect: async (action, api) => {
			const generation = accountGeneration(api.getState());
			const current = () => generation === accountGeneration(api.getState());
			try {
				const repo = getUserRepo();
				if (!repo) throw new Error("user repo unavailable");

				const user = await repo.getById(action.payload.userId);
				if (!current()) return;

				// repo retourne null => 401 => session invalide
				if (!user) {
					api.dispatch(authSignedOut());
					return;
				}

				api.dispatch(authUserHydrationSucceeded({ user }));
			} catch (error: any) {
				if (!current()) return;
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
			const attempt = ++epoch;
			const oAuthGateway = getOAuthGateway();
			const secureStore = getSecureStore();
			const authServer = getAuthServer();

			const session = activeSession;
			// Signing out must always release the UI immediately. Remote logout is
			// best-effort only: a stalled network request must never trap the root
			// navigator on its loading screen.
			activeSession = undefined;
			deps.onSessionChanged?.(activeSession);

			if (secureStore) {
				await writeSecure(() => secureStore.clearSession()).catch(() => undefined);
			}

			if (attempt === epoch) api.dispatch(authSignedOut());

			void (async () => {
				if (!session) return;
				const remoteOperations: Promise<void>[] = [];
				if (authServer) remoteOperations.push(authServer.logout(session));
				if (oAuthGateway) remoteOperations.push(oAuthGateway.signOut(session.provider));
				const results = await Promise.allSettled(remoteOperations);
				results.forEach(result => {
					if (result.status === "rejected") {
						console.warn("[LOGOUT] remote revocation failed", result.reason);
					}
				});
			})();
		},
	});

	listen({
		predicate: action => authSignedOut.match(action) || authSessionExpired.match(action),
		effect: () => {
			++epoch;
			activeSession = undefined;
			deps.onSessionChanged?.(undefined);
			const storage = getSecureStore();
			if (storage) void writeSecure(() => storage.clearSession()).catch(() => undefined);
		},
	});
	return middleware.middleware;
};
