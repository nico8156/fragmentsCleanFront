import type { RootStateWl } from "@/app/store/reduxStoreWl";
import {
    commandKinds,
    statusTypes,
    type OutboxRecord,
    type OutboxStateWl,
    type StatusType,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { createSelector } from "@reduxjs/toolkit";

export const selectOutbox = (s: RootStateWl): OutboxStateWl => {
    return (s as any).oState as OutboxStateWl;
};

export const selectOutboxQueue = (s: RootStateWl): OutboxStateWl["queue"] =>
    selectOutbox(s).queue;

export const selectOutboxById = (s: RootStateWl): OutboxStateWl["byId"] =>
    selectOutbox(s).byId;

const pendingStatuses = new Set<string>([
    statusTypes.queued,
    statusTypes.processing,
    statusTypes.awaitingAck,
]);

export const isOutboxPendingStatus = (status?: StatusType): boolean =>
    Boolean(status && pendingStatuses.has(status));

const toOutboxRecords = (byId: OutboxStateWl["byId"]): OutboxRecord[] =>
    Object.values(byId ?? {});

const selectOutboxRecords = createSelector([selectOutboxById], toOutboxRecords);

export const selectPendingLikeCommandKindForTarget =
    (targetId: string, userId?: string) =>
        (s: RootStateWl): typeof commandKinds.LikeAdd | typeof commandKinds.LikeRemove | null => {
            for (const rec of selectOutboxRecords(s) as any[]) {
                if (!isOutboxPendingStatus(rec?.status)) continue;
                const command = rec?.item?.command;
                if (!command) continue;
                if (command.kind !== commandKinds.LikeAdd && command.kind !== commandKinds.LikeRemove) continue;
                if (String(command.targetId ?? "") !== String(targetId)) continue;
                if (userId && command.userId && String(command.userId) !== String(userId)) continue;
                return command.kind;
            }
            return null;
        };

export const selectOutboxStatusByCommentId = createSelector([selectOutboxRecords], (records): Record<string, StatusType> => {
    const result: Record<string, StatusType> = {};

    for (const rec of records as any[]) {
        const command = rec?.item?.command;
        if (!command) continue;

        let commentId = "";
        if (command.kind === commandKinds.CommentCreate) {
            commentId = String(command.commentId ?? command.tempId ?? "");
        } else if (command.kind === commandKinds.CommentUpdate || command.kind === commandKinds.CommentDelete) {
            commentId = String(command.commentId ?? "");
        }

        if (!commentId) continue;

        const current = result[commentId];
        const next = rec.status as StatusType;

        if (!current) {
            result[commentId] = next;
            continue;
        }
        if (current === statusTypes.failed) continue;
        if (next === statusTypes.failed) {
            result[commentId] = next;
            continue;
        }
        if (isOutboxPendingStatus(current)) continue;
        if (isOutboxPendingStatus(next)) {
            result[commentId] = next;
            continue;
        }

        result[commentId] = statusTypes.succeeded;
    }

    return result;
});

export const selectOutboxStatusByTicketId = createSelector([selectOutboxRecords], (records): Record<string, StatusType> => {
    const result: Record<string, StatusType> = {};

    for (const rec of records as any[]) {
        const command = (rec as any)?.item?.command;
        if (command?.kind !== commandKinds.TicketVerify) continue;
        if (!command.ticketId) continue;
        result[String(command.ticketId)] = rec.status;
    }

    return result;
});
