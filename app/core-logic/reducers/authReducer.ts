import {createReducer} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {loginWithGoogleBeginned, loginWithGoogleSucceeded} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

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
            .addCase(loginWithGoogleBeginned, (state, action) => {
                state.status = "authenticating";
            })
            .addCase(loginWithGoogleSucceeded, (state, action) => {
                state.status = "authenticated";
                state.user = action.payload;
                state.error = null;
            })
    }
)