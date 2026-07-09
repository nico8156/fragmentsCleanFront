import { commandKinds, statusTypes, type OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

const pendingStatuses = new Set<string>([
	statusTypes.queued,
	statusTypes.processing,
	statusTypes.awaitingAck,
]);

export const hasPendingCommentCommandForComment = (
	outbox: OutboxStateWl | undefined,
	commentId: string,
): boolean => {
	return hasPendingCommentCommandForCommentMatching(outbox, commentId);
};

export const hasPendingCommentDeleteCommandForComment = (
	outbox: OutboxStateWl | undefined,
	commentId: string,
): boolean => {
	return hasPendingCommentCommandForCommentMatching(outbox, commentId, new Set([commandKinds.CommentDelete]));
};

const hasPendingCommentCommandForCommentMatching = (
	outbox: OutboxStateWl | undefined,
	commentId: string,
	kinds?: Set<string>,
): boolean => {
	const records = Object.values(outbox?.byId ?? {}) as any[];
	return records.some((rec) => {
		if (!pendingStatuses.has(rec?.status)) return false;
		const command = rec?.item?.command;
		if (!command) return false;
		if (kinds && !kinds.has(command.kind)) return false;
		if (
			command.kind !== commandKinds.CommentCreate &&
			command.kind !== commandKinds.CommentUpdate &&
			command.kind !== commandKinds.CommentDelete
		) {
			return false;
		}
		const transportedCommentId = String(command.commentId ?? command.tempId ?? "");
		return transportedCommentId === String(commentId);
	});
};
