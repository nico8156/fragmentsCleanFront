import { AppThunkWl } from "@/app/store/reduxStoreWl";
import {
    authSessionLoadRequested,
    authSignInRequested,
    authSignOutRequested,
    authUserHydrationRequested,
} from "@/app/contextWL/userWl/typeAction/user.action";
import { ProviderId, UserId } from "@/app/contextWL/userWl/typeAction/user.type";

export const initializeAuth = (): AppThunkWl => (dispatch) => {
    dispatch(authSessionLoadRequested());
};

export const signInWithProvider = ({
    provider,
    scopes,
}: {
    provider: ProviderId;
    scopes?: string[];
}): AppThunkWl => (dispatch) => {
    dispatch(authSignInRequested({ provider, scopes }));
};

export const refreshUser = ({ userId }: { userId: UserId }): AppThunkWl => (dispatch) => {
    dispatch(authUserHydrationRequested({ userId }));
};

export const signOut = (): AppThunkWl => (dispatch) => {
    dispatch(authSignOutRequested());
};
