import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { createReconciled, dropCommitted } from "@/app/core-logic/contextWL/outboxWl/processOutbox";

export const onCommentCreatedAck = createAction<{
    commandId: string;
    tempId: string;
    server: { id: string; createdAt: string; version: number };
}>("SERVER/COMMENT/ON_COMMENT_CREATED_ACK");

export const onCommentUpdatedAck = createAction<{
    commandId: string;
    commentId: string;
    server: { editedAt: string; version: number; body?: string };
}>("SERVER/COMMENT/ON_COMMENT_UPDATED_ACK");

export const onCommentDeletedAck = createAction<{
    commandId: string;
    commentId: string;
    server: { deletedAt: string; version: number };
}>("SERVER/COMMENT/ON_COMMENT_DELETED_ACK");

export const updateReconciled = createAction<{
    commentId: string;
    server: { editedAt: string; version: number; body?: string };
}>("COMMENT/UPDATE_RECONCILED");

export const deleteReconciled = createAction<{
    commentId: string;
    server: { deletedAt: string; version: number };
}>("COMMENT/DELETE_RECONCILED");

const selectOutboxByCommandId = (s: AppStateWl, cmdId: string) =>
    (s as any).oState?.byCommandId?.[cmdId];

export const ackListenerFactory = (deps: DependenciesWl, callback?: () => void) => {
    const ackReceivedBySocketUseCase = createListenerMiddleware();
    const listener = ackReceivedBySocketUseCase.startListening as TypedStartListening<
        AppStateWl,
        AppDispatchWl
    >;

    listener({
        actionCreator: onCommentCreatedAck,
        effect: async (action, api) => {
            const { commandId, tempId, server } = action.payload;
            const outboxId = (api.getState() as any).oState.byCommandId?.[commandId];

            console.log("[ACK_COMMENTS] onCommentCreatedAck", {
                commandId,
                tempId,
                server,
                outboxId,
            });

            api.dispatch(createReconciled({ tempId, server }));

            if (outboxId) {
                console.log("[ACK_COMMENTS] dropCommitted (created)", {
                    commandId,
                    outboxId,
                });
                api.dispatch(dropCommitted({ commandId }));
            }

            if (callback) callback();
        },
    });

    listener({
        actionCreator: onCommentUpdatedAck,
        effect: async (action, api) => {
            const { commandId, commentId, server } = action.payload;

            console.log("[ACK_COMMENTS] onCommentUpdatedAck", {
                commandId,
                commentId,
                server,
            });

            // 1) reconcile
            api.dispatch(updateReconciled({ commentId, server }));

            // 2) drop outbox if present
            const outboxId = selectOutboxByCommandId(api.getState(), commandId);
            if (outboxId) {
                console.log("[ACK_COMMENTS] dropCommitted (updated)", {
                    commandId,
                    outboxId,
                });
                api.dispatch(dropCommitted({ commandId }));
            }

            if (callback) callback();
        },
    });

    listener({
        actionCreator: onCommentDeletedAck,
        effect: async ({ payload: { commandId, commentId, server } }, api) => {
            console.log("[ACK_COMMENTS] onCommentDeletedAck", {
                commandId,
                commentId,
                server,
            });

            api.dispatch(deleteReconciled({ commentId, server }));

            const outboxId = (api.getState() as any).oState?.byCommandId?.[commandId];
            if (outboxId) {
                console.log("[ACK_COMMENTS] dropCommitted (deleted)", {
                    commandId,
                    outboxId,
                });
                api.dispatch(dropCommitted({ commandId }));
            }

            if (callback) callback();
        },
    });

    return ackReceivedBySocketUseCase;
};
