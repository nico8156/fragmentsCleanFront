import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
	selectAuthError,
	selectAuthStatus,
	selectCurrentUser,
	selectSessionSnapshot,
} from "@/app/core-logic/contextWL/userWl/selector/user.selector";

import {
	authMaybeRefreshRequested,
	avatarAttachRequested,
	avatarRemoveRequested,
	profileUpdateRequested,
	accountDeletionRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import type { AppUser } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { signInWithProvider, signOut } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

const GOOGLE_SCOPES = ["openid", "email", "profile"] as const;

const selectPrimaryEmail = (user: AppUser | undefined): string | undefined => {
	if (!user) return undefined;
	const identityWithEmail = user.identities.find((identity) => Boolean(identity.email));
	return identityWithEmail?.email ?? undefined;
};

export function useAuthUser() {
	const dispatch = useDispatch<any>();

	const status = useSelector(selectAuthStatus);
	const error = useSelector(selectAuthError);
	const user = useSelector(selectCurrentUser);
	const session = useSelector(selectSessionSnapshot);

	// ✅ source de vérité pour "connecté" = session présente
	const hasSession = Boolean(session?.userId);
	const hasUser = Boolean(user);

	const isSignedIn = hasSession;
	const isHydratingUser = hasSession && !hasUser;
	const isLoading = status === "loading";
	const hasError = status === "error";

	// ✅ plus de fake fallback ici : si non hydraté => undefined
	const displayName = user?.displayName;
	const avatarUrl = user?.avatarUrl;
	const primaryEmail = selectPrimaryEmail(user);
	const bio = user?.bio;
	const profileMutationStatus = useSelector((state: any) => state.aState.profileMutationStatus ?? "idle");
	const profileMutationError = useSelector((state: any) => state.aState.profileMutationError);
	const accountDeletionStatus = useSelector((state: any) => state.aState.accountDeletionStatus ?? "idle");
	const accountDeletionError = useSelector((state: any) => state.aState.accountDeletionError);

	const signInWithGoogle = useCallback(() => {
		if (isLoading) return;
		dispatch(signInWithProvider({ provider: "google", scopes: [...GOOGLE_SCOPES] }));
	}, [dispatch, isLoading]);
	const signInWithApple = useCallback(() => {
		if (isLoading) return;
		dispatch(signInWithProvider({ provider: "apple", scopes: ["name", "email"] }));
	}, [dispatch, isLoading]);

	const signOutUser = useCallback(() => {
		if (isLoading) return;
		dispatch(signOut());
	}, [dispatch, isLoading]);

	const refreshToken = useCallback(() => {
		dispatch(authMaybeRefreshRequested());
	}, [dispatch]);

	const updateDisplayName = useCallback((nextDisplayName: string) => {
		dispatch(profileUpdateRequested({ displayName: nextDisplayName }));
	}, [dispatch]);
	const replaceAvatar = useCallback((image: Parameters<typeof avatarAttachRequested>[0]) => {
		dispatch(avatarAttachRequested(image));
	}, [dispatch]);
	const removeAvatar = useCallback(() => dispatch(avatarRemoveRequested()), [dispatch]);
	const deleteAccount = useCallback(() => dispatch(accountDeletionRequested()), [dispatch]);

	const authSummary = useMemo(
		() => ({
			user,
			session,
			status,
			error,

			hasSession,
			hasUser,
			isHydratingUser,

			isLoading,
			isSignedIn,
			hasError,

			displayName,
			avatarUrl,
			primaryEmail,
			bio,
			profileMutationStatus,
			profileMutationError,
			accountDeletionStatus,
			accountDeletionError,
		}),
		[
			user,
			session,
			status,
			error,
			hasSession,
			hasUser,
			isHydratingUser,
			isLoading,
			isSignedIn,
			hasError,
			displayName,
			avatarUrl,
			primaryEmail,
			bio,
			profileMutationStatus,
			profileMutationError,
			accountDeletionStatus,
			accountDeletionError,
		],
	);

	return {
		...authSummary,
		signInWithGoogle,
		signInWithApple,
		refreshToken,
		signOut: signOutUser,
		updateDisplayName,
		replaceAvatar,
		removeAvatar,
		deleteAccount,
	} as const;
}
