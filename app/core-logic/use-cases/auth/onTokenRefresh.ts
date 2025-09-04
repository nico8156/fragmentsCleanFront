// onTokenRefresh.ts
import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import type { AppDispatch } from "@/app/store/reduxStore";
import type { AppState } from "@/app/store/appState";
import {loginFailed, loginSucceeded} from "@/app/core-logic/use-cases/auth/onGoogleAuth";
import {logoutClicked} from "@/app/core-logic/use-cases/auth/onLogoutClicked";


export const tokensRefreshed = createAction<{ accessToken: string; expiresAt: number }>("auth/TOKENS_REFRESHED");


export const onTokenRefreshFactory = (deps: {
    refresh: (refreshToken: string) => Promise<{ accessToken: string; expiresAt: number }>;
    skewMs?: number; // marge avant expiration
}) => {
    const onTokenRefresh = createListenerMiddleware();
    const listen = onTokenRefresh.startListening as TypedStartListening<AppState, AppDispatch>;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };

    listen({
        actionCreator: loginSucceeded,
        effect: async (action, api) => {
            clear();
            const skew = deps.skewMs ?? 60_000;
            const { expiresAt, refreshToken } = api.getState().authState.authData;
            if (!expiresAt || !refreshToken) return;
            const delay = Math.max(0, expiresAt - Date.now() - skew);
            timer = setTimeout(async () => {
                try {
                    const { accessToken, expiresAt } = await deps.refresh(refreshToken);
                    // mets à jour ton slice (ajoute une action updateTokens si besoin)
                    api.dispatch(tokensRefreshed({ accessToken, expiresAt }));
                } catch {
                    api.dispatch(loginFailed("REFRESH_ERROR"));
                }
            }, delay);
        },
    });

    listen({
        actionCreator: logoutClicked,
        effect: clear
    });

    return onTokenRefresh;
};
