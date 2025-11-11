import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectLikesForTarget } from "@/app/core-logic/contextWL/likeWl/selector/likeWl.selector";
import { loadingStates } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import { uiLikeToggleRequested } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";
import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

const DEFAULT_STALE_AFTER_MS = 60_000;

type LikeSelectorResult = ReturnType<ReturnType<typeof selectLikesForTarget>>;

// 1) Valeur constante, référentiellement stable
const EMPTY_LIKES_RESULT: LikeSelectorResult = {
    count: 0,
    likedByMe: false,
    isOptimistic: false,
    loading: loadingStates.IDLE,
    staleAfterMs: DEFAULT_STALE_AFTER_MS,
    hasFetched: false,
    error: undefined,
    lastFetchedAt: undefined,
};

// 2) Selector "vide" qui renvoie toujours la même ref
const selectEmptyLikes: (state: RootStateWl) => LikeSelectorResult = () => EMPTY_LIKES_RESULT;

export function useLikesForCafe(targetId?: CoffeeId) {
    const dispatch = useDispatch<any>();

    // 3) On ne recrée plus de () => ({...}) dans le useMemo
    const selector = useMemo(() => {
        if (!targetId) {
            return selectEmptyLikes;
        }
        return selectLikesForTarget(targetId); // factory Reselect
    }, [targetId]);

    const {
        count,
        likedByMe,
        isOptimistic,
        loading,
        error,
        lastFetchedAt,
        staleAfterMs,
        hasFetched,
    } = useSelector(selector);

    useEffect(() => {
        if (!targetId) return;
        if (loading === loadingStates.PENDING) return;

        if (!hasFetched) {
            dispatch(likesRetrieval({ targetId }));
            return;
        }

        const lastFetchTime = lastFetchedAt ? Date.parse(lastFetchedAt) : 0;
        const effectiveStaleAfterMs = staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
        const isStale = Number.isFinite(lastFetchTime)
            ? Date.now() - lastFetchTime > effectiveStaleAfterMs
            : true;

        if (isStale) {
            dispatch(likesRetrieval({ targetId }));
        }
    }, [dispatch, targetId, loading, hasFetched, lastFetchedAt, staleAfterMs]);

    const toggleLike = useCallback(() => {
        if (!targetId) return;
        dispatch(uiLikeToggleRequested({ targetId }));
    }, [dispatch, targetId]);

    const refresh = useCallback(() => {
        if (!targetId) return;
        dispatch(likesRetrieval({ targetId }));
    }, [dispatch, targetId]);

    const isLoading = !hasFetched && loading === loadingStates.PENDING;
    const isRefreshing = hasFetched && loading === loadingStates.PENDING;

    return {
        count,
        likedByMe,
        isOptimistic,
        isLoading,
        isRefreshing,
        error,
        toggleLike,
        refresh,
    } as const;
}