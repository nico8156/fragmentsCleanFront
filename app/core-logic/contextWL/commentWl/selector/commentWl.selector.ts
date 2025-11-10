import { createSelector } from "@reduxjs/toolkit";

import { CafeId, CommentEntity, LoadingState, loadingStates } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { RootStateWl } from "@/app/store/reduxStoreWl";

type CommentsSlice = RootStateWl["cState"];

type CommentsSelectorResult = {
    comments: CommentEntity[];
    loading: LoadingState;
    error?: string;
    lastFetchedAt?: string;
    staleAfterMs: number;
};

const selectCommentsState = (state: RootStateWl): CommentsSlice => state.cState;

export const selectCommentsForTarget = (targetId: CafeId) =>
    createSelector(
        [
            (state: RootStateWl) => selectCommentsState(state).entities.entities,
            (state: RootStateWl) => selectCommentsState(state).byTarget[targetId],
        ],
        (entities, view): CommentsSelectorResult => {
            if (!view) {
                return {
                    comments: [],
                    loading: loadingStates.IDLE,
                    error: undefined,
                    lastFetchedAt: undefined,
                    staleAfterMs: 30_000,
                };
            }

            const comments = (view.ids ?? [])
                .map((id) => entities[id])
                .filter((comment): comment is CommentEntity => Boolean(comment));

            return {
                comments,
                loading: view.loading,
                error: view.error,
                lastFetchedAt: view.lastFetchedAt,
                staleAfterMs: view.staleAfterMs ?? 30_000,
            };
        },
    );
