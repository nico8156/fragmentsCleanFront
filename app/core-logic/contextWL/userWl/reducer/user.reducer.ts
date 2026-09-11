import {
	authErrorCleared,
	authSessionExpired,
	authSessionLoadFailed,
	authSessionLoadRequested,
	authSessionLoaded,
	authSessionRefreshed,
	authSessionRefreshFailed,
	authSignInFailed,
	authSignInRequested,
	authSignInSucceeded,
	authSignOutRequested,
	authSignedOut,
	authUserHydrationFailed,
	authUserHydrationRequested,
	authUserHydrationSucceeded,
	profileUpdateOptimistic,
	profileUpdateRejectedLocally,
	profileUpdateReconciled,
	profileUpdateRollback,
	avatarUpdateOptimistic,
	avatarUpdateRollback,
	accountDeletionSubmitting,
	accountDeletionAccepted,
	accountDeletionFailed,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import {
	AppUser,
	AuthState,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { createReducer } from "@reduxjs/toolkit";

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
			state.profileStatus = state.currentUser ? "loaded" : "idle";
			state.profileError = undefined;
		})
		.addCase(authSessionLoadFailed, (state, { payload }) => {
			state.status = "error";
			state.error = payload.error;
		})
		.addCase(authSignInRequested, (state) => {
			state.status = "loading";
			state.error = undefined;
			state.accountDeletionStatus = "idle";
			state.accountDeletionError = undefined;
			state.accountDeletionCommandId = undefined;
		})
		.addCase(authSignInSucceeded, (state, { payload }) => {
			state.status = "signedIn";
			state.session = payload.session;
			state.error = undefined;
			state.profileStatus = state.currentUser ? "loaded" : "idle";
			state.profileError = undefined;
		})
		.addCase(authSignInFailed, (state, { payload }) => {
			state.status = "error";
			state.error = payload.error;
		})
		.addCase(authSessionRefreshed, (state, { payload }) => {
			if (state.session) {
				state.session = payload.session;
			}
			state.error = undefined;
		})
		.addCase(authSessionRefreshFailed, (state, { payload }) => {
			state.error = payload.error;
		})
		.addCase(authSessionExpired, (state, { payload }) => {
			state.status = "error";
			state.error = payload.reason ?? "session expired";
			state.session = undefined;
			state.currentUser = undefined;
		})

		// ✅ CHANGEMENT IMPORTANT :
		// on ne casse plus le statut "signedIn" pendant l'hydration user
		// (sinon flicker + runtime "pas signedIn" + pas de resync)
		.addCase(authUserHydrationRequested, (state) => {
			// Ne touche pas au status ni aux erreurs de refresh transitoires.
			state.profileStatus = "loading";
			state.profileError = undefined;
		})

		.addCase(authUserHydrationSucceeded, (state, { payload }) => {
			state.status = "signedIn";
			state.currentUser = mergeUser(state.currentUser, payload.user);
			state.error = undefined;
			state.profileStatus = "loaded";
			state.profileError = undefined;
		})
		.addCase(authUserHydrationFailed, (state, { payload }) => {
			if (state.session) {
				state.status = "signedIn";
				state.profileStatus = "error";
				state.profileError = payload.error;
				return;
			}
			state.status = "error";
			state.error = payload.error;
			state.profileStatus = "error";
			state.profileError = payload.error;
		})
		.addCase(authSignOutRequested, (state) => {
			state.status = "loading";
			state.session = undefined;
			state.currentUser = undefined;
			state.profileMutationStatus = "idle";
			state.profileMutationError = undefined;
			state.accountDeletionStatus = "idle";
			state.accountDeletionError = undefined;
			state.accountDeletionCommandId = undefined;
		})
		.addCase(authSignedOut, (state) => {
			state.status = "signedOut";
			state.session = undefined;
			state.currentUser = undefined;
			state.error = undefined;
			state.profileStatus = "idle";
			state.profileError = undefined;
			state.profileMutationStatus = "idle";
			state.profileMutationError = undefined;
			state.accountDeletionStatus = "idle";
			state.accountDeletionError = undefined;
			state.accountDeletionCommandId = undefined;
		})
		.addCase(authErrorCleared, (state) => {
			state.error = undefined;
		})
		.addCase(profileUpdateOptimistic, (state, { payload }) => {
			if (state.currentUser) {
				state.currentUser.displayName = payload.displayName;
				state.currentUser.version += 1;
			}
			state.profileMutationStatus = "pending";
			state.profileMutationError = undefined;
		})
		.addCase(profileUpdateRejectedLocally, (state, { payload }) => {
			state.profileMutationStatus = "error";
			state.profileMutationError = payload.error;
		})
		.addCase(profileUpdateRollback, (state, { payload }) => {
			if (state.currentUser) {
				state.currentUser.displayName = payload.displayName;
				state.currentUser.version = payload.version;
			}
			state.profileMutationStatus = "error";
			state.profileMutationError = payload.error;
		})
		.addCase(avatarUpdateOptimistic, (state, { payload }) => {
			if (state.currentUser) {
				state.currentUser.avatarUrl = payload.avatarUrl;
				state.currentUser.version += 1;
			}
			state.profileMutationStatus = "pending";
			state.profileMutationError = undefined;
		})
		.addCase(avatarUpdateRollback, (state, { payload }) => {
			if (state.currentUser) {
				state.currentUser.avatarUrl = payload.avatarUrl;
				state.currentUser.version = payload.version;
			}
			state.profileMutationStatus = "error";
			state.profileMutationError = payload.error;
		})
		.addCase(profileUpdateReconciled, (state) => {
			state.profileMutationStatus = "saved";
			state.profileMutationError = undefined;
		})
		.addCase(accountDeletionSubmitting, (state, { payload }) => {
			state.accountDeletionStatus = "submitting";
			state.accountDeletionCommandId = payload.commandId;
			state.accountDeletionError = undefined;
		})
		.addCase(accountDeletionAccepted, (state) => {
			state.accountDeletionStatus = "accepted";
			state.accountDeletionError = undefined;
		})
		.addCase(accountDeletionFailed, (state, { payload }) => {
			state.accountDeletionStatus = "error";
			state.accountDeletionError = payload.error;
		});
});
