import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { selectLikesForTarget } from "@/app/core-logic/contextWL/likeWl/selector/likeWl.selector";
import { likeSyncCleared } from "@/app/core-logic/contextWL/likeWl/typeAction/likeSync.action";
import { loadingStates } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { likesRetrieval } from "@/app/core-logic/contextWL/likeWl/usecases/read/likeRetrieval";
import { uiLikeToggleRequested } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

const DEFAULT_STALE_AFTER_MS = 60_000;

type LikeSelectorResult = ReturnType<ReturnType<typeof selectLikesForTarget>>;

const EMPTY_LIKES_RESULT: LikeSelectorResult = {
	count: 0,
	likedByMe: false,
	isOptimistic: false,
	loading: loadingStates.IDLE,
	staleAfterMs: DEFAULT_STALE_AFTER_MS,
	hasFetched: false,
	error: undefined,
	lastFetchedAt: undefined,
	sync: null,
};

const selectEmptyLikes: (state: RootStateWl) => LikeSelectorResult = () => EMPTY_LIKES_RESULT;

export function useLikesForCafe(targetId?: CoffeeId) {
	const dispatch = useDispatch<any>();

	const selector = useMemo(() => {
		if (!targetId) return selectEmptyLikes;
		return selectLikesForTarget(targetId);
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
		sync, // ✅ FIX: on récupère sync
	} = useSelector(selector);

	// ✅ Auto-clear du ring après TTL
	useEffect(() => {
		if (!targetId) return;
		if (!sync) return;

		const delay = Math.max(0, sync.untilMs - Date.now());
		const t = setTimeout(() => {
			dispatch(likeSyncCleared({ targetId }));
		}, delay);

		return () => clearTimeout(t);
	}, [dispatch, targetId, sync?.state, sync?.untilMs]);

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
		sync, // ✅ renvoyé pour l’UI ring
		isLoading,
		isRefreshing,
		error,
		toggleLike,
		refresh,
	} as const;
}
