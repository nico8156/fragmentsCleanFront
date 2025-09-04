import {createReducer} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {loginFailed, loginRequested, loginSucceeded} from "@/app/core-logic/use-cases/auth/onGoogleAuth";
import {logoutClicked} from "@/app/core-logic/use-cases/auth/onLogoutClicked";

const initialState: AppState['authState'] = {
    authData: {
        status: "anonymous",
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        error: null,
    }
}

//TODO make auth reducer instead ... better approach !
// think use cases that are relevant ...

export const userAuthReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(loginRequested, (state, action) => {
                state.authData.status = "authenticating";
                state.authData.error = null;
            })
            .addCase(loginSucceeded, (state, a) => {
                const { user, tokens } = a.payload;
                state.authData.status = "authenticated";
                state.authData.user = user;
                state.authData.accessToken = tokens.accessToken;
                state.authData.refreshToken = tokens.refreshToken;
                state.authData.expiresAt = tokens.expiresAt;
                state.authData.error = null;
            })
            .addCase(loginFailed, (state, a) => {
                state.authData.status = "error";
                state.authData.error = a.payload;
            })
            .addCase(logoutClicked, (state, a) => {
                state.authData.status = "anonymous";
                state.authData.user = null;
                state.authData.accessToken = null;
                state.authData.refreshToken = null;
                state.authData.expiresAt = null;
                state.authData.error = null;
            })
        ;
    }
)