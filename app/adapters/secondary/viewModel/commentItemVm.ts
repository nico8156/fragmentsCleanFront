import { getCommunityProfile } from "@/app/adapters/secondary/fakeData/communityProfiles";
import { isOutboxPendingStatus } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { statusTypes, type StatusType } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { CommentEntity } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

export type CommentTransportStatus = "pending" | "success" | "failed";

export type CommentUserVMSource = {
	displayName?: string | null;
	avatarUrl?: string | null;
};

export type BuildCommentItemVMInput = {
	comment: CommentEntity;
	currentUser?: CommentUserVMSource | null;
	effectiveUserId?: string | null;
	outboxStatus?: StatusType;
	showPendingFeedback: boolean;
	nowMs: number;
};

const buildFallbackAvatarUrl = (id: string) =>
	`https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

const normalizeAuthorId = (authorId: string) => authorId;

export const formatRelativeTime = (isoDate: string, nowMs = Date.now()): string => {
	const d = new Date(isoDate);
	if (Number.isNaN(d.getTime())) return "Date inconnue";

	const diffMs = nowMs - d.getTime();
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

export const toCommentTransportStatus = (status?: StatusType): CommentTransportStatus => {
	if (status === statusTypes.failed) return "failed";
	if (isOutboxPendingStatus(status)) return "pending";
	return "success";
};

export const buildCommentItemVM = ({
	comment,
	currentUser,
	effectiveUserId,
	outboxStatus,
	showPendingFeedback,
	nowMs,
}: BuildCommentItemVMInput) => {
	const meId = effectiveUserId ? String(effectiveUserId) : undefined;
	const normalizedAuthorId = normalizeAuthorId(comment.authorId);
	const isCurrentUser = Boolean(meId) && String(meId) === String(comment.authorId);
	const communityProfile = getCommunityProfile(normalizedAuthorId);
	const transportStatus = toCommentTransportStatus(outboxStatus);

	const fallbackName = isCurrentUser
		? currentUser?.displayName ?? "Moi"
		: communityProfile?.displayName ?? normalizedAuthorId;

	const fallbackAvatar = isCurrentUser
		? currentUser?.avatarUrl ?? buildFallbackAvatarUrl(String(meId ?? "me"))
		: communityProfile?.avatarUrl ?? buildFallbackAvatarUrl(normalizedAuthorId);

	return {
		id: comment.id,
		authorName: comment.authorName ?? fallbackName,
		avatarUrl: (comment.avatarUrl ?? undefined) ?? fallbackAvatar,
		body: comment.body,
		createdAt: comment.createdAt,
		relativeTime: formatRelativeTime(comment.createdAt, nowMs),
		transportStatus,
		showPendingFeedback: transportStatus === "pending" && showPendingFeedback,
		isOptimistic: Boolean(comment.optimistic),
		isAuthor: isCurrentUser,
	};
};
