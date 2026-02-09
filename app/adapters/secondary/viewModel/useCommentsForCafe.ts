import { useCallback, useEffect, useMemo } from "react";
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

import { commandKinds, statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { selectCurrentUser, selectEffectiveUserId } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

import { getCommunityProfile } from "@/app/adapters/secondary/fakeData/communityProfiles";

const DEFAULT_STALE_AFTER_MS = 30_000;

const buildFallbackAvatarUrl = (id: string) =>
	`https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

const normalizeAuthorId = (authorId: string) => authorId;

export type CommentItemVM = {
	id: string;
	authorName: string;
	avatarUrl: string;
	body: string;
	createdAt: string;
	relativeTime: string;

	isOptimistic: boolean;
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

	const { comments, loading, error, lastFetchedAt, staleAfterMs } =
		useSelector(selector);

	// -------------------------
	// outbox -> status mapping (optimistic create only)
	// -------------------------
	const outboxRecords = useSelector((state: RootStateWl) => state.oState.byId);

	const outboxStatusByCommentId = useMemo(() => {
		const result: Record<string, string> = {};

		const values = Object.values(outboxRecords ?? {}) as any[];
		for (const rec of values) {
			const cmd = rec?.item?.command;
			if (!cmd) continue;

			// only create has tempId (== final commentId)
			if (cmd.kind === commandKinds.CommentCreate) {
				const id = String(cmd.tempId);
				result[id] = rec.status;
			}
		}

		return result;
	}, [outboxRecords]);

	// -------------------------
	// VM
	// -------------------------
	const viewModel: CommentItemVM[] = useMemo(() => {
		const meId = effectiveUserId ? String(effectiveUserId) : undefined;

		// (double safety) remove soft deleted here too
		const visible = comments.filter(
			(c) => !c.deletedAt && c.moderation !== moderationTypes.SOFT_DELETED,
		);

		return visible.map((c) => {
			const normalizedAuthorId = normalizeAuthorId(c.authorId);

			const isCurrentUser =
				Boolean(meId) && String(meId) === String(c.authorId);

			const communityProfile = getCommunityProfile(normalizedAuthorId);

			// transport status: only relevant for optimistic create
			let transportStatus: "pending" | "success" | "failed" = "success";
			if (c.optimistic) {
				const status = outboxStatusByCommentId[c.id];
				transportStatus =
					status === statusTypes.failed ? "failed" : "pending";
			}

			const fallbackName = isCurrentUser
				? currentUser?.displayName ?? "Moi"
				: communityProfile?.displayName ?? normalizedAuthorId;

			const fallbackAvatar = isCurrentUser
				? currentUser?.avatarUrl ?? buildFallbackAvatarUrl(String(meId ?? "me"))
				: communityProfile?.avatarUrl ?? buildFallbackAvatarUrl(normalizedAuthorId);

			// prefer server/enriched values (or optimistic enriched)
			const authorName = c.authorName ?? fallbackName;
			const avatarUrl = (c.avatarUrl ?? undefined) ?? fallbackAvatar;

			return {
				id: c.id,
				authorName,
				avatarUrl,
				body: c.body,
				createdAt: c.createdAt,
				relativeTime: formatRelativeTime(c.createdAt),
				isOptimistic: Boolean(c.optimistic),
				transportStatus,
				isAuthor: isCurrentUser,
			};
		});
	}, [comments, outboxStatusByCommentId, currentUser, effectiveUserId]);

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
		uiViaHookCreateComment,
		uiViaHookUpdateComment,
		uiViaHookDeleteComment,
	} as const;
}

