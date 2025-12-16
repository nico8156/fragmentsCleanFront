import { createSelector } from "@reduxjs/toolkit";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import {selectAllComments} from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import {selectAllLikeAggs} from "@/app/core-logic/contextWL/likeWl/selector/likeWl.selector";
import {UserId} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

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
// ✅ IMPORTANT : on prend le userId de session si currentUser pas encore hydraté
export const selectEffectiveUserId = createSelector(
    selectAuthState,
    (state): UserId | undefined => state.session?.userId ?? state.currentUser?.id,
);
export const selectUserSocialStats = createSelector(
    [selectEffectiveUserId, selectAllComments, selectAllLikeAggs],
    (userId, comments, likesAgg) => {
        if (!userId) return { commentCount: 0, likeCount: 0 };

        const commentsList = Object.values(comments);
        const likesList = Object.values(likesAgg);

        // authorId côté back = UUID string, userId = UUID string => OK
        const commentCount = commentsList.filter((c: any) => c?.authorId === userId).length;
        const likeCount = likesList.filter((agg: any) => agg?.me).length;

        return { commentCount, likeCount };
    },
);