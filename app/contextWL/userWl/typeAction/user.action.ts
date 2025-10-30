import { createAction } from "@reduxjs/toolkit";
import {
    AppUser,
    AuthSessionSnapshot,
    ProviderId,
    UserId,
} from "@/app/contextWL/userWl/typeAction/user.type";

export const authSessionLoadRequested = createAction("auth/sessionLoadRequested");

export const authSessionLoaded = createAction<{ session: AuthSessionSnapshot }>(
    "auth/sessionLoaded",
);

export const authSessionLoadFailed = createAction<{ error: string }>(
    "auth/sessionLoadFailed",
);

export const authSignInRequested = createAction<{ provider: ProviderId; scopes?: string[] }>(
    "auth/signInRequested",
);

export const authSignInSucceeded = createAction<{
    session: AuthSessionSnapshot;
    profile: { provider: ProviderId; userId: UserId };
}>("auth/signInSucceeded");

export const authSignInFailed = createAction<{ error: string }>("auth/signInFailed");

export const authMaybeRefreshRequested = createAction("auth/maybeRefreshRequested");

export const authSessionRefreshed = createAction<{ session: AuthSessionSnapshot }>(
    "auth/sessionRefreshed",
);

export const authSessionRefreshFailed = createAction<{ error: string }>(
    "auth/sessionRefreshFailed",
);

export const authSessionExpired = createAction<{ reason?: string }>("auth/sessionExpired");

export const authUserHydrationRequested = createAction<{ userId: UserId }>(
    "auth/userHydrationRequested",
);

export const authUserHydrationSucceeded = createAction<{ user: AppUser }>(
    "auth/userHydrationSucceeded",
);

export const authUserHydrationFailed = createAction<{ error: string }>(
    "auth/userHydrationFailed",
);

export const authSignOutRequested = createAction("auth/signOutRequested");

export const authSignedOut = createAction("auth/signedOut");

export const authErrorCleared = createAction("auth/errorCleared");

