import { isOutboxPendingStatus } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { commandKinds, type OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const hasPendingLikeCommandForTarget = (
	outbox: OutboxStateWl | undefined,
	targetId: string,
	userId?: string,
): boolean => {
	return getPendingLikeCommandKindForTarget(outbox, targetId, userId) !== null;
};

export const getPendingLikeCommandKindForTarget = (
	outbox: OutboxStateWl | undefined,
	targetId: string,
	userId?: string,
): typeof commandKinds.LikeAdd | typeof commandKinds.LikeRemove | null => {
	const records = Object.values(outbox?.byId ?? {}) as any[];
	for (const rec of records) {
		if (!isOutboxPendingStatus(rec?.status)) continue;
		const command = rec?.item?.command;
		if (!command) continue;
		if (command.kind !== commandKinds.LikeAdd && command.kind !== commandKinds.LikeRemove) {
			continue;
		}
		if (String(command.targetId ?? "") !== String(targetId)) continue;
		if (userId && command.userId && String(command.userId) !== String(userId)) continue;
		return command.kind;
	}
	return null;
};
