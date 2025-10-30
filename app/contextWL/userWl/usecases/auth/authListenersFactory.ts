import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import {
    authSessionExpired,
    authSessionLoadFailed,
    authSessionLoadRequested,
    authSessionLoaded,
    authSessionRefreshed,
    authSessionRefreshFailed,
    authSignInFailed,
    authSignInRequested,
    authSignInSucceeded,
    authSignOutRequested,
    authSignedOut,
    authUserHydrationFailed,
    authUserHydrationRequested,
    authUserHydrationSucceeded,
    authMaybeRefreshRequested,
} from "@/app/contextWL/userWl/typeAction/user.action";
import {
    AuthSession,
    OAuthProfile,
    ProviderId,
    toUserId,
} from "@/app/contextWL/userWl/typeAction/user.type";
import { toSessionSnapshot } from "@/app/contextWL/userWl/utils/sessionSnapshot";

const deriveUserId = (profile: OAuthProfile): AuthSession["userId"] =>
    toUserId(`${profile.provider}:${profile.providerUserId}`);

const MINIMUM_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const authListenerFactory = (deps: DependenciesWl) => {
    const middleware = createListenerMiddleware();
    const listen = middleware.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;
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
                    api.dispatch(authSignedOut());
                    return;
                }
                activeSession = stored;
                api.dispatch(authSessionLoaded({ session: toSessionSnapshot(stored) }));
                api.dispatch(authMaybeRefreshRequested());
                api.dispatch(authUserHydrationRequested({ userId: stored.userId }));
            } catch (error: any) {
                activeSession = undefined;
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
            try {
                if (!oAuthGateway) throw new Error("oauth gateway unavailable");
                if (!secureStore) throw new Error("auth secure store unavailable");
                const { profile, tokens } = await oAuthGateway.startSignIn(action.payload.provider, {
                    scopes: action.payload.scopes,
                });
                const session: AuthSession = {
                    userId: deriveUserId(profile),
                    tokens,
                    provider: profile.provider,
                    scopes: action.payload.scopes ?? [],
                    establishedAt: Date.now(),
                };
                activeSession = session;
                await secureStore.saveSession(session);
                api.dispatch(
                    authSignInSucceeded({
                        session: toSessionSnapshot(session),
                        profile: {
                            provider: profile.provider,
                            userId: session.userId,
                        },
                    }),
                );
                api.dispatch(authUserHydrationRequested({ userId: session.userId }));
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
            if (!activeSession) return;
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
                await secureStore.saveSession(refreshed.session);
                api.dispatch(authSessionRefreshed({ session: toSessionSnapshot(refreshed.session) }));
                if (refreshed.user) {
                    api.dispatch(authUserHydrationSucceeded({ user: refreshed.user }));
                }
            } catch (error: any) {
                activeSession = undefined;
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
                if (!user) throw new Error("user not found");
                api.dispatch(authUserHydrationSucceeded({ user }));
            } catch (error: any) {
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
            const provider: ProviderId | undefined = activeSession?.provider;
            activeSession = undefined;
            try {
                await secureStore?.clearSession();
            } catch (error) {
                console.warn("Failed to clear auth session", error);
            }
            if (provider && oAuthGateway) {
                try {
                    await oAuthGateway.signOut(provider);
                } catch (error) {
                    console.warn("Failed to sign out from provider", error);
                }
            }
            api.dispatch(authSignedOut());
        },
    });

    return middleware.middleware;
};
