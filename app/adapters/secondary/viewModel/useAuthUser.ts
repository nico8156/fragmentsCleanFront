import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    selectAuthError,
    selectAuthStatus,
    selectCurrentUser,
    selectSessionSnapshot,
} from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import { signInWithProvider, signOut } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";
import type { AppUser } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { DEFAULT_COMMUNITY_PROFILE } from "@/app/adapters/secondary/fakeData/communityProfiles";

const GOOGLE_SCOPES = ["openid", "email", "profile"] as const;

const selectPrimaryEmail = (user: AppUser | undefined): string | undefined => {
    if (!user) {
        return undefined;
    }

    const identityWithEmail = user.identities.find((identity) => Boolean(identity.email));
    return identityWithEmail?.email ?? undefined;
};

export function useAuthUser() {
    const dispatch = useDispatch<AppDispatchWl>();

    const status = useSelector(selectAuthStatus);
    const error = useSelector(selectAuthError);
    const user = useSelector(selectCurrentUser);
    const session = useSelector(selectSessionSnapshot);

    const isLoading = status === "loading";
    const isSignedIn = status === "signedIn";
    const hasError = status === "error";

    const displayName = user?.displayName ?? DEFAULT_COMMUNITY_PROFILE.displayName;
    const avatarUrl = user?.avatarUrl ?? DEFAULT_COMMUNITY_PROFILE.avatarUrl;
    const primaryEmail = selectPrimaryEmail(user) ?? DEFAULT_COMMUNITY_PROFILE.email;
    const bio = user?.bio ?? DEFAULT_COMMUNITY_PROFILE.bio ?? undefined;

    const signInWithGoogle = useCallback(() => {
        if (isLoading) {
            return;
        }
        dispatch(signInWithProvider({ provider: "google", scopes: [...GOOGLE_SCOPES] }));
    }, [dispatch, isLoading]);

    const signOutUser = useCallback(() => {
        if (isLoading) {
            return;
        }
        dispatch(signOut());
    }, [dispatch, isLoading]);

    const authSummary = useMemo(
        () => ({
            user,
            session,
            status,
            error,
            isLoading,
            isSignedIn,
            hasError,
            displayName,
            avatarUrl,
            primaryEmail,
            bio,
        }),
        [
            user,
            session,
            status,
            error,
            isLoading,
            isSignedIn,
            hasError,
            displayName,
            avatarUrl,
            primaryEmail,
            bio,
        ],
    );

    return {
        ...authSummary,
        signInWithGoogle,
        signOut: signOutUser,
    } as const;
}
