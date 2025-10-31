import { createReducer } from "@reduxjs/toolkit";
import {
    authErrorCleared,
    authSessionExpired,
    authSessionLoadFailed,
    authSessionLoaded,
    authSessionLoadRequested,
    authSessionRefreshed,
    authSignInFailed,
    authSignInRequested,
    authSignInSucceeded,
    authSignOutRequested,
    authSignedOut,
    authUserHydrationFailed,
    authUserHydrationRequested,
    authUserHydrationSucceeded,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import {
    AppUser,
    AuthState,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

const initialState: AuthState = {
    status: "loading",
};

const mergeUser = (existing: AppUser | undefined, next: AppUser) => {
    if (!existing) return next;
    if (next.version >= existing.version) {
        return next;
    }
    return existing;
};

export const authReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(authSessionLoadRequested, (state) => {
            state.status = "loading";
            state.error = undefined;
        })
        .addCase(authSessionLoaded, (state, { payload }) => {
            state.status = "signedIn";
            state.session = payload.session;
            state.error = undefined;
        })
        .addCase(authSessionLoadFailed, (state, { payload }) => {
            state.status = "error";
            state.error = payload.error;
        })
        .addCase(authSignInRequested, (state) => {
            state.status = "loading";
            state.error = undefined;
        })
        .addCase(authSignInSucceeded, (state, { payload }) => {
            state.status = "signedIn";
            state.session = payload.session;
            state.error = undefined;
        })
        .addCase(authSignInFailed, (state, { payload }) => {
            state.status = "error";
            state.error = payload.error;
        })
        .addCase(authSessionRefreshed, (state, { payload }) => {
            if (state.session) {
                state.session = payload.session;
            }
        })
        .addCase(authSessionExpired, (state, { payload }) => {
            state.status = "error";
            state.error = payload.reason ?? "session expired";
            state.session = undefined;
            state.currentUser = undefined;
        })
        .addCase(authUserHydrationRequested, (state) => {
            if (state.status === "signedIn") {
                state.status = "loading";
            }
        })
        .addCase(authUserHydrationSucceeded, (state, { payload }) => {
            state.status = "signedIn";
            state.currentUser = mergeUser(state.currentUser, payload.user);
            state.error = undefined;
        })
        .addCase(authUserHydrationFailed, (state, { payload }) => {
            state.status = "error";
            state.error = payload.error;
        })
        .addCase(authSignOutRequested, (state) => {
            state.status = "loading";
        })
        .addCase(authSignedOut, (state) => {
            state.status = "signedOut";
            state.session = undefined;
            state.currentUser = undefined;
            state.error = undefined;
        })
        .addCase(authErrorCleared, (state) => {
            state.error = undefined;
        });
});
