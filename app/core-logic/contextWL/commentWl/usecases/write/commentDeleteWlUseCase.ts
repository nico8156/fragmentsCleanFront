// commentDeleteWlUseCase.ts
import {
    createAction,
    createListenerMiddleware,
    nanoid,
    TypedStartListening,
} from "@reduxjs/toolkit";
import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

export const uiCommentDeleteRequested = createAction<{ commentId: string }>(
    "UI/COMMENT/DELETE_REQUESTED",
);

export const deleteOptimisticApplied = createAction<{
    commentId: string;
    clientDeletedAt: ISODate;
}>("COMMENT/DELETE_OPTIMISTIC");

export const commentDeleteUseCaseFactory = (deps: DependenciesWl, callback?: () => void) => {
    const mw = createListenerMiddleware();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: uiCommentDeleteRequested,
        effect: async ({ payload: { commentId } }, api) => {
            const state: any = api.getState();
            const cur = state.cState.entities.entities[commentId];
            if (!cur || cur.optimistic) return; // 🔒

            const commandId = deps.helpers?.newCommandId?.() ?? (`cmd_${nanoid()}` as any);
            const outboxId = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
            const at = (deps.helpers?.nowIso?.() ?? new Date().toISOString()) as ISODate;

            // 1️⃣ optimistic
            api.dispatch(deleteOptimisticApplied({ commentId, clientDeletedAt: at }));

            // 2️⃣ outbox
            api.dispatch(
                enqueueCommitted({
                    id: outboxId,
                    item: {
                        command: {
                            kind: commandKinds.CommentDelete,
                            commandId,
                            commentId,
                            at,
                        },
                        undo: {
                            kind: commandKinds.CommentDelete,
                            commentId,
                            prevBody: cur.body,
                            prevDeletedAt: cur.deletedAt,
                            prevVersion: cur.version,
                        },
                    },
                    enqueuedAt: at,
                }),
            );

            api.dispatch(outboxProcessOnce());
            callback?.();
        },
    });

    return mw;
};
