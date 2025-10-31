import { createSelector } from "@reduxjs/toolkit";
import { RootStateWl } from "@/app/store/reduxStoreWl";

export const selectAuthState = (state: RootStateWl) => state.aState;

export const selectAuthStatus = createSelector(selectAuthState, (state) => state.status);

export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

export const selectCurrentUser = createSelector(
    selectAuthState,
    (state) => state.currentUser,
);

export const selectSessionSnapshot = createSelector(
    selectAuthState,
    (state) => state.session,
);

export const selectIsSignedIn = createSelector(
    selectAuthStatus,
    (status) => status === "signedIn",
);
