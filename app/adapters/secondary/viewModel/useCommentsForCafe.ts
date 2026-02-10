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

import { commandKinds, StatusType, statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { selectCurrentUser, selectEffectiveUserId } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

import { getCommunityProfile } from "@/app/adapters/secondary/fakeData/communityProfiles";

const DEFAULT_STALE_AFTER_MS = 30_000;

const buildFallbackAvatarUrl = (id: string) =>
	`https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

const normalizeAuthorId = (authorId: string) => authorId;

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

const formatRelativeTime = (isoDate: string): string => {
	const d = new Date(isoDate);
	if (Number.isNaN(d.getTime())) return "Date inconnue";

	const diffMs = Date.now() - d.getTime();
	const diffSec = Math.max(1, Math.floor(diffMs / 1000));
	if (diffSec < 60) return "À l'instant";

	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `Il y a ${diffMin} min`;

	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `Il y a ${diffHours} h`;

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `Il y a ${diffDays} j`;

	const diffWeeks = Math.floor(diffDays / 7);
	if (diffWeeks < 5) return `Il y a ${diffWeeks} sem`;

	return d.toLocaleDateString("fr-FR");
};

const isPendingStatus = (s?: StatusType) =>
	s === statusTypes.queued || s === statusTypes.processing || s === statusTypes.awaitingAck;

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
	const outboxRecords = useSelector((state: RootStateWl) => state.oState.byId);

	const outboxStatusByCommentId = useMemo(() => {
		const result: Record<string, StatusType> = {};
		const values = Object.values(outboxRecords ?? {}) as any[];

		for (const rec of values) {
			const cmd = rec?.item?.command;
			if (!cmd) continue;

			// We want the ID of the comment being transported
			// - Create: cmd.commentId (preferred) else cmd.tempId (legacy)
			// - Update/Delete: cmd.commentId
			let commentId: string | null = null;

			if (cmd.kind === commandKinds.CommentCreate) {
				commentId = String(cmd.commentId ?? cmd.tempId ?? "");
			} else if (cmd.kind === commandKinds.CommentUpdate || cmd.kind === commandKinds.CommentDelete) {
				commentId = String(cmd.commentId ?? "");
			}

			if (!commentId) continue;

			// If multiple records exist (rare), we keep the "most blocking" one:
			// failed > pending > succeeded
			const cur = result[commentId];
			const next: StatusType = rec.status;

			if (!cur) {
				result[commentId] = next;
				continue;
			}

			if (cur === statusTypes.failed) continue;
			if (next === statusTypes.failed) {
				result[commentId] = next;
				continue;
			}

			if (isPendingStatus(cur)) continue;
			if (isPendingStatus(next)) {
				result[commentId] = next;
				continue;
			}

			// else both succeeded -> keep succeeded
			result[commentId] = statusTypes.succeeded;
		}

		return result;
	}, [outboxRecords]);

	// -------------------------
	// VM
	// -------------------------
	const viewModel: CommentItemVM[] = useMemo(() => {
		const meId = effectiveUserId ? String(effectiveUserId) : undefined;

		const visible = comments.filter(
			(c) => !c.deletedAt && c.moderation !== moderationTypes.SOFT_DELETED,
		);

		return visible.map((c) => {
			const normalizedAuthorId = normalizeAuthorId(c.authorId);
			const isCurrentUser = Boolean(meId) && String(meId) === String(c.authorId);

			const communityProfile = getCommunityProfile(normalizedAuthorId);

			// ✅ transportStatus derived from outbox status (NOT optimistic flag)
			const status = outboxStatusByCommentId[c.id];

			let transportStatus: "pending" | "success" | "failed" = "success";
			if (status === statusTypes.failed) transportStatus = "failed";
			else if (isPendingStatus(status)) transportStatus = "pending";
			else transportStatus = "success";

			const fallbackName = isCurrentUser
				? currentUser?.displayName ?? "Moi"
				: communityProfile?.displayName ?? normalizedAuthorId;

			const fallbackAvatar = isCurrentUser
				? currentUser?.avatarUrl ?? buildFallbackAvatarUrl(String(meId ?? "me"))
				: communityProfile?.avatarUrl ?? buildFallbackAvatarUrl(normalizedAuthorId);

			const authorName = c.authorName ?? fallbackName;
			const avatarUrl = (c.avatarUrl ?? undefined) ?? fallbackAvatar;

			return {
				id: c.id,
				authorName,
				avatarUrl,
				body: c.body,
				createdAt: c.createdAt,
				relativeTime: formatRelativeTime(c.createdAt),
				transportStatus,
				isAuthor: isCurrentUser,
			};
		});
	}, [comments, outboxStatusByCommentId, currentUser, effectiveUserId]);

	// -------------------------
	// sync VM (like-like halo)
	// -------------------------
	const [sync, setSync] = useState<CommentSyncVM>(null);
	const prevPendingCountRef = useRef(0);

	const pendingCount = useMemo(
		() => viewModel.filter((c) => c.transportStatus === "pending").length,
		[viewModel],
	);
	const failedCount = useMemo(
		() => viewModel.filter((c) => c.transportStatus === "failed").length,
		[viewModel],
	);

	useEffect(() => {
		const prevPending = prevPendingCountRef.current;

		if (pendingCount > 0) {
			setSync({ state: "pending", untilMs: Date.now() + 10_000 });
			prevPendingCountRef.current = pendingCount;
			return;
		}

		if (prevPending > 0 && pendingCount === 0 && failedCount === 0) {
			setSync({ state: "acked", untilMs: Date.now() + 900 });
			prevPendingCountRef.current = 0;
			return;
		}

		if (failedCount > 0) {
			setSync({ state: "failed", untilMs: Date.now() + 1500 });
			prevPendingCountRef.current = 0;
			return;
		}

		prevPendingCountRef.current = 0;
		setSync(null);
	}, [pendingCount, failedCount]);

	useEffect(() => {
		if (!sync) return;
		if (sync.state === "pending") return;

		const delay = Math.max(0, sync.untilMs - Date.now());
		const t = setTimeout(() => setSync(null), delay);
		return () => clearTimeout(t);
	}, [sync?.state, sync?.untilMs]);

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
