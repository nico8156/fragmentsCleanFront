import {createAction} from "@reduxjs/toolkit";
import {AppThunk} from "@/app/store/reduxStore";
import {Tokens, User} from "@/app/store/appState";

export const loginRequested  = createAction<"google">("LOGIN_REQUESTED");
export const loginSucceeded  = createAction<{ user: User; tokens: Tokens }>("LOGIN_SUCCEEDED");
export const loginFailed     = createAction<string>("LOGIN_FAILED");


export const startGoogleLogin = (): AppThunk<Promise<void>> =>
    async (dispatch, _getState, { authGateway }) => {
        dispatch(loginRequested("google"));
        try {
            const { user, tokens } = await authGateway.signInWithGoogle();
            dispatch(loginSucceeded({ user, tokens }));
        } catch (e) {
            dispatch(loginFailed("PROVIDER_ERROR"));
        }
    };