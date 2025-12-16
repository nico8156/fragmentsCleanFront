import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppStateWl } from "@/app/store/appStateWl";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";

import {createReconciled, dropCommitted} from "@/app/core-logic/contextWL/outboxWl/processOutbox";

// ---- Types ----
type ISODate = string;

export type CommentCreatedAckActionPayload = {
    commandId: string;
    commentId: string; // ✅ c'est ton tempId côté front (UUID) et le même côté back
    targetId: string;
    server: { createdAt: ISODate; version: number };
};

export type CommentUpdatedAckActionPayload = {
    commandId: string;
    commentId: string;
    server: { editedAt: ISODate; version: number; body?: string };
};

export type CommentDeletedAckActionPayload = {
    commandId: string;
    commentId: string;
    server: { deletedAt: ISODate; version: number };
};

// ---- Actions ----
export const onCommentCreatedAck = createAction<CommentCreatedAckActionPayload>(
    "SERVER/COMMENT/CREATED_ACK",
);

export const onCommentUpdatedAck = createAction<CommentUpdatedAckActionPayload>(
    "SERVER/COMMENT/UPDATED_ACK",
);

export const onCommentDeletedAck = createAction<CommentDeletedAckActionPayload>(
    "SERVER/COMMENT/DELETED_ACK",
);

// Ces actions doivent être consommées par ton reducer comment.
// Elles “confirment” l’état côté front (pas de remap id nécessaire).
export const createConfirmed = createAction<{
    commentId: string;
    targetId: string;
    server: { createdAt: ISODate; version: number };
}>("COMMENT/CREATE_CONFIRMED");

export const updateReconciled = createAction<{
    commentId: string;
    server: { editedAt: ISODate; version: number; body?: string };
}>("COMMENT/UPDATE_RECONCILED");

export const deleteReconciled = createAction<{
    commentId: string;
    server: { deletedAt: ISODate; version: number };
}>("COMMENT/DELETE_RECONCILED");

// ---- Selector optionnel (si tu as un index byCommandId) ----
const selectOutboxIdByCommandId = (s: AppStateWl, commandId: string): string | undefined => {
    const anyState = s as any;
    return anyState?.oState?.byCommandId?.[commandId];
};

// ---- Listener factory ----
export const ackListenerFactory = (callback?: () => void) => {
    const mw = createListenerMiddleware<AppStateWl, AppDispatchWl>();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: onCommentCreatedAck,
        effect: async ({ payload }, api) => {
            const { commandId, commentId, targetId, server } = payload;
            const outboxId = selectOutboxIdByCommandId(api.getState(), commandId);

            console.log("[ACK_COMMENTS] created", { commandId, commentId, targetId, server, outboxId });

            // ✅ pas de reconcile tempId->serverId : l'id est déjà le bon
            //api.dispatch(createConfirmed({ commentId, targetId, server }));

            api.dispatch(createReconciled({ commentId, server }));

            api.dispatch(dropCommitted({ commandId }));

            callback?.();
        },
    });

    listen({
        actionCreator: onCommentUpdatedAck,
        effect: async ({ payload }, api) => {
            const { commandId, commentId, server } = payload;
            const outboxId = selectOutboxIdByCommandId(api.getState(), commandId);

            console.log("[ACK_COMMENTS] updated", { commandId, commentId, server, outboxId });

            api.dispatch(updateReconciled({ commentId, server }));

            if (outboxId) {
                api.dispatch(dropCommitted({ commandId }));
            } else {
                api.dispatch(dropCommitted({ commandId }));
            }

            callback?.();
        },
    });

    listen({
        actionCreator: onCommentDeletedAck,
        effect: async ({ payload }, api) => {
            const { commandId, commentId, server } = payload;
            const outboxId = selectOutboxIdByCommandId(api.getState(), commandId);

            console.log("[ACK_COMMENTS] deleted", { commandId, commentId, server, outboxId });

            api.dispatch(deleteReconciled({ commentId, server }));

            if (outboxId) {
                api.dispatch(dropCommitted({ commandId }));
            } else {
                api.dispatch(dropCommitted({ commandId }));
            }

            callback?.();
        },
    });

    return mw;
};
