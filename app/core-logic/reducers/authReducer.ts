import {createReducer} from "@reduxjs/toolkit";
import {AppState} from "@/app/store/appState";
import {loginWithGoogleBeginned} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

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
    }
)