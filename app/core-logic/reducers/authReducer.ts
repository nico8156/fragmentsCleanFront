import {createReducer} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {
    loginWithGoogleBegan,
    loginWithGoogleFailed,
    loginWithGoogleSucceeded
} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

const initialState:AppState["authState"] = {
    status: "anonymous",
    user:null,
    accessToken:null,
    refreshToken:null,
    expiresAt:null,
    error:null,
}

export const authReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(loginWithGoogleBegan, (state, action) => {
                state.status = "authenticating";
            })
            .addCase(loginWithGoogleSucceeded, (state, action) => {
                state.status = "authenticated";
                state.user = action.payload;
                state.error = null;
            })
            .addCase(loginWithGoogleFailed, (state, action) => {
                state.status = "error";
                state.error = action.payload;
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.expiresAt = null;
            })
    }
)