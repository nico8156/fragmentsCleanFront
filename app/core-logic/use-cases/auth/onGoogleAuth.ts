// core-logic/use-cases/auth/onGoogleAuth.ts
import {
    createAction,
    createListenerMiddleware,
    TypedStartListening,
} from "@reduxjs/toolkit";
import { AppDispatch } from "@/app/store/reduxStore";
import {AppState, Tokens, User} from "@/app/store/appState";
import {AuthGateway} from "@/app/core-logic/gateways/authGateway";


export const loginRequested  = createAction<"google">("LOGIN_REQUESTED");
export const loginSucceeded  = createAction<{ user: User; tokens: Tokens }>("LOGIN_SUCCEEDED");
export const loginFailed     = createAction<string>("LOGIN_FAILED");


export const onGoogleAuthFactory = (
    authGateway: AuthGateway,
    callback: () => void,
) => {
    const onGoogleAuth = createListenerMiddleware();
    const listener = onGoogleAuth.startListening as TypedStartListening<
        AppState,
        AppDispatch
    >;

    listener({
        actionCreator: loginRequested,
        effect: async (_action, api) => {
            //simuler le call réel 
            setTimeout(async () => {
                try {
                    const { user, tokens } = await authGateway.signInWithGoogle();
                    api.dispatch(loginSucceeded({ user, tokens }));
                } catch (e: any) {
                    // à adapter si tu gères une action loginCancelled séparée
                    api.dispatch(loginFailed(e?.message === "popup_closed_by_user"
                        ? "CANCELLED"
                        : "PROVIDER_ERROR",
                    ));
                } finally {
                    callback();
                }
            }, 2000);
        },
    });

    return onGoogleAuth;
};
