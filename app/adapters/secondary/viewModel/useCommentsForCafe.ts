import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootStateWl } from "@/app/store/reduxStoreWl";

import { selectCommentsForTarget } from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import {
	CafeId,
	CommentEntity,
	LoadingState,
	loadingStates,
	moderationTypes,
	opTypes,
} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

import { commentRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { uiCommentCreateRequested } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { uiCommentDeleteRequested } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";
import { cuAction } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";

import {
	isOutboxPendingStatus,
	selectOutboxStatusByCommentId,
} from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { StatusType } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { selectCurrentUser, selectEffectiveUserId } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

import {
	computeCommentSyncDecision,
	computeLocalPendingFeedbackIds,
} from "@/app/adapters/secondary/viewModel/commentSyncVm";
import { buildCommentItemVM } from "@/app/adapters/secondary/viewModel/commentItemVm";

const DEFAULT_STALE_AFTER_MS = 30_000;

export type CommentSyncState = "pending" | "acked" | "failed";
export type CommentSyncVM = { state: CommentSyncState; untilMs: number } | null;

export type CommentItemVM = {
	id: string;
	authorName: string;
	avatarUrl: string;
	body: string;
	createdAt: string;
	relativeTime: string;

	transportStatus: "pending" | "success" | "failed";
	showPendingFeedback: boolean;
	isOptimistic: boolean;
	isAuthor: boolean;
};

type CommentsSelectorResult = {
	comments: CommentEntity[];
	loading: LoadingState;
	error?: string;
	lastFetchedAt?: string;
	staleAfterMs: number;
};

const EMPTY_COMMENTS_RESULT: CommentsSelectorResult = {
	comments: [],
	loading: loadingStates.IDLE,
	error: undefined,
	lastFetchedAt: undefined,
	staleAfterMs: DEFAULT_STALE_AFTER_MS,
};

const selectEmptyComments: (state: RootStateWl) => CommentsSelectorResult = () =>
	EMPTY_COMMENTS_RESULT;

const isPendingStatus = (s?: StatusType) => isOutboxPendingStatus(s);

export function useCommentsForCafe(targetId?: CafeId) {
	const dispatch = useDispatch<any>();

	const currentUser = useSelector(selectCurrentUser);
	const effectiveUserId = useSelector(selectEffectiveUserId);

	// -------------------------
	// UI actions
	// -------------------------
	const uiViaHookCreateComment = useCallback(
		({ targetId, body }: { targetId: string; body: string }) => {
			dispatch(uiCommentCreateRequested({ targetId, body }));
		},
		[dispatch],
	);

	const uiViaHookUpdateComment = useCallback(
		({ commentId, body }: { commentId: string; body: string }) => {
			dispatch(cuAction({ commentId, newBody: body }));
		},
		[dispatch],
	);

	const uiViaHookDeleteComment = useCallback(
		({ commentId }: { commentId: string }) => {
			dispatch(uiCommentDeleteRequested({ commentId }));
		},
		[dispatch],
	);

	// -------------------------
	// selector for target
	// -------------------------
	const selector = useMemo(() => {
		if (!targetId) return selectEmptyComments;
		return selectCommentsForTarget(targetId);
	}, [targetId]);

	const { comments, loading, error, lastFetchedAt, staleAfterMs } = useSelector(selector);

	// -------------------------
	// outbox -> status mapping
	// IMPORTANT: front is source of truth => key is commentId
	// -------------------------
	const outboxStatusByCommentId = useSelector(selectOutboxStatusByCommentId);

	const pendingIdsAtEntryRef = useRef<Set<string>>(new Set());
	const localPendingIdsRef = useRef<Set<string>>(new Set());
	const pendingIdsTargetRef = useRef<CafeId | undefined>(undefined);

	if (pendingIdsTargetRef.current !== targetId) {
		pendingIdsTargetRef.current = targetId;
		pendingIdsAtEntryRef.current = new Set(
			Object.entries(outboxStatusByCommentId)
				.filter(([, status]) => isPendingStatus(status))
				.map(([id]) => id),
		);
		localPendingIdsRef.current = new Set();
	} else {
		localPendingIdsRef.current = computeLocalPendingFeedbackIds({
			pendingIds: Object.entries(outboxStatusByCommentId)
				.filter(([, status]) => isPendingStatus(status))
				.map(([id]) => id),
			pendingIdsAtEntry: pendingIdsAtEntryRef.current,
			currentLocalIds: localPendingIdsRef.current,
		});
	}

	// -------------------------
	// VM
	// -------------------------
	const viewModel: CommentItemVM[] = useMemo(() => {
		const meId = effectiveUserId ? String(effectiveUserId) : undefined;
		const nowMs = Date.now();

		const visible = comments.filter(
			(c) => !c.deletedAt && c.moderation !== moderationTypes.SOFT_DELETED,
		);

		return visible.map((c) => {
			const status = outboxStatusByCommentId[c.id];
			return buildCommentItemVM({
				comment: c,
				currentUser,
				effectiveUserId: meId,
				outboxStatus: status,
				showPendingFeedback: localPendingIdsRef.current.has(c.id),
				nowMs,
			});
		});
	}, [comments, outboxStatusByCommentId, currentUser, effectiveUserId]);

	// -------------------------
	// sync VM (like-like halo)
	// -------------------------
	const [sync, setSync] = useState<CommentSyncVM>(null);
	const prevPendingCountRef = useRef(0);
	const hasSeenInitialPendingRef = useRef(false);
	const hasLocalPendingCycleRef = useRef(false);

	const pendingCount = useMemo(
		() => viewModel.filter((c) => c.transportStatus === "pending").length,
		[viewModel],
	);
	const failedCount = useMemo(
		() => viewModel.filter((c) => c.transportStatus === "failed").length,
		[viewModel],
	);

	useEffect(() => {
		prevPendingCountRef.current = 0;
		hasSeenInitialPendingRef.current = false;
		hasLocalPendingCycleRef.current = false;
		setSync(null);
	}, [targetId]);

	useEffect(() => {
		const decision = computeCommentSyncDecision({
			pendingCount,
			failedCount,
			prevPendingCount: prevPendingCountRef.current,
			hasSeenInitialPending: hasSeenInitialPendingRef.current,
			hasLocalPendingCycle: hasLocalPendingCycleRef.current,
			nowMs: Date.now(),
		});
		prevPendingCountRef.current = decision.nextPrevPendingCount;
		hasSeenInitialPendingRef.current = decision.nextHasSeenInitialPending;
		hasLocalPendingCycleRef.current = decision.nextHasLocalPendingCycle;
		setSync(decision.sync);
	}, [pendingCount, failedCount]);

	useEffect(() => {
		if (!sync) return;
		if (sync.state === "pending") return;

		const delay = Math.max(0, sync.untilMs - Date.now());
		const t = setTimeout(() => setSync(null), delay);
		return () => clearTimeout(t);
	}, [sync]);

	// -------------------------
	// read lifecycle
	// -------------------------
	useEffect(() => {
		if (!targetId) return;
		if (loading === loadingStates.PENDING) return;

		const hasFetchedOnce = Boolean(lastFetchedAt);
		const lastFetchTime = lastFetchedAt ? Date.parse(lastFetchedAt) : 0;
		const ttl = staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

		const isStale =
			!lastFetchTime || Number.isNaN(lastFetchTime)
				? true
				: Date.now() - lastFetchTime > ttl;

		if (!hasFetchedOnce) {
			dispatch(commentRetrieval({ targetId, op: opTypes.RETRIEVE, cursor: "", limit: 10 }));
			return;
		}

		if (isStale) {
			dispatch(commentRetrieval({ targetId, op: opTypes.REFRESH, cursor: "", limit: 10 }));
		}
	}, [dispatch, targetId, loading, lastFetchedAt, staleAfterMs]);

	const isLoading = !lastFetchedAt && loading === loadingStates.PENDING && viewModel.length === 0;
	const isRefreshing = Boolean(lastFetchedAt) && loading === loadingStates.PENDING && viewModel.length > 0;

	return {
		comments: viewModel,
		isLoading,
		isRefreshing,
		error,
		sync,
		uiViaHookCreateComment,
		uiViaHookUpdateComment,
		uiViaHookDeleteComment,
	} as const;
}
