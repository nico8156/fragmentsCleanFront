import {createReducer} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {loginFailed, loginRequested, loginSucceeded} from "@/app/core-logic/use-cases/auth/onGoogleAuth";
import {logoutClicked} from "@/app/core-logic/use-cases/auth/onLogoutClicked";
import {tokensRefreshed} from "@/app/core-logic/use-cases/auth/onTokenRefresh";

const initialState: AppState['authState'] = {

        status: "anonymous",
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        error: null,

}

//TODO make auth reducer instead ... better approach !
// think use cases that are relevant ...

export const userAuthReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(loginRequested, (state, action) => {
                state.status = "authenticating";
                state.error = null;
            })
            .addCase(loginSucceeded, (state, action) => {
                const { user, tokens } = action.payload;
                state.status = "authenticated";
                state.user = user;
                state.accessToken = tokens.accessToken;
                state.refreshToken = tokens.refreshToken;
                state.expiresAt = tokens.expiresAt;
                state.error = null;
            })
            .addCase(loginFailed, (state, action) => {
                state.status = "error";
                state.error = action.payload;
            })
            .addCase(logoutClicked, (state, a) => {
                state.status = "anonymous";
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.expiresAt = null;
                state.error = null;
            })
            builder.addCase(tokensRefreshed, (state, action) => {
                state.accessToken = action.payload.accessToken;
                state.expiresAt = action.payload.expiresAt;
            });

        ;
    }
)