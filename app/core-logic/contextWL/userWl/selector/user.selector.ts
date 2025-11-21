import { createSelector } from "@reduxjs/toolkit";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import {selectAllComments} from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import {selectAllLikeAggs} from "@/app/core-logic/contextWL/likeWl/selector/likeWl.selector";

export const selectAuthState = (state: RootStateWl) => state.aState;
const selectCurrentUserId = (state: RootStateWl) => state.aState.currentUser?.id;

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
export const selectUserSocialStats = createSelector(
    [selectCurrentUserId, selectAllComments, selectAllLikeAggs],
    (userId, comments, likesAgg) => {
        if (!userId) {
            return { commentCount: 0, likeCount: 0 };
        }
        let commentsList = Object.values(comments);
        let likesList = Object.values(likesAgg);

        const commentCount = commentsList.filter((c: any) => c?.authorId === userId).length;
        const likeCount = likesList.filter((agg: any) => agg?.me).length;

        return { commentCount, likeCount };
    },
);