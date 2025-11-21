import {createSelector} from "@reduxjs/toolkit";

import {loadingStates, LoadingState} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";

const DEFAULT_STALE_AFTER_MS = 60_000;

type LikeSlice = RootStateWl["lState"];

type LikeSelectorResult = {
    count: number;
    likedByMe: boolean;
    isOptimistic: boolean;
    loading: LoadingState;
    error?: string;
    lastFetchedAt?: string;
    staleAfterMs: number;
    hasFetched: boolean;
};

const selectLikesState = (state: RootStateWl): LikeSlice => state.lState;
export const selectAllLikeAggs = (state: RootStateWl) => state.lState.byTarget;


export const selectLikesForTarget = (targetId: string) =>
    createSelector(
        [(state: RootStateWl) => selectLikesState(state).byTarget[targetId]],
        (aggregate): LikeSelectorResult => {
            if (!aggregate) {
                return {
                    count: 0,
                    likedByMe: false,
                    isOptimistic: false,
                    loading: loadingStates.IDLE,
                    staleAfterMs: DEFAULT_STALE_AFTER_MS,
                    hasFetched: false,
                };
            }

            return {
                count: aggregate.count,
                likedByMe: aggregate.me,
                isOptimistic: Boolean(aggregate.optimistic),
                loading: aggregate.loading,
                error: aggregate.error,
                lastFetchedAt: aggregate.lastFetchedAt,
                staleAfterMs: aggregate.staleAfterMs ?? DEFAULT_STALE_AFTER_MS,
                hasFetched: Boolean(aggregate.lastFetchedAt),
            };
        },
    );
