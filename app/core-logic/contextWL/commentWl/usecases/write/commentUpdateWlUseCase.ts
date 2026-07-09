import {
    createAction,
    createListenerMiddleware,
    nanoid,
    TypedStartListening,
} from "@reduxjs/toolkit";
import { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {enqueueCommitted, outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {updateOptimisticApplied} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { hasPendingCommentCommandForComment } from "@/app/core-logic/contextWL/commentWl/usecases/write/pendingCommentCommand";

export const cuAction = createAction<{ commentId: string; newBody: string }>(
    "UI/COMMENT/UPDATE",
);

const getCurrentUserId = (state: any, deps: DependenciesWl): string | undefined =>
    state.aState?.session?.userId ??
    state.aState?.currentUser?.id ??
    deps.helpers?.currentUserId?.();


export const commentUpdateWlUseCase = (deps: DependenciesWl, callback?: () => void) => {
    const mw = createListenerMiddleware();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: cuAction,
        effect: async ({ payload }, api) => {
            const { commentId, newBody } = payload;
            const trimmed = newBody.trim();
            if (!trimmed) return;

            const state: any = api.getState();
            const cur = state.cState.entities.entities[commentId];
            if (!cur) return;
            if (hasPendingCommentCommandForComment(state.oState, commentId)) return;

            const currentUserId = getCurrentUserId(state, deps);
            if (!currentUserId || String(cur.authorId) !== String(currentUserId)) return;

            const commandId = deps.helpers?.newCommandId?.() ?? (`cmd_${nanoid()}` as any);
            const outboxId = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
            const at = (deps.helpers?.nowIso?.() ?? new Date().toISOString()) as ISODate;

            // 1️⃣ optimistic
            api.dispatch(updateOptimisticApplied({ commentId, newBody: trimmed, clientEditedAt: at }));

            // 2️⃣ outbox
            api.dispatch(
                enqueueCommitted({
                    id: outboxId,
                    item: {
                        command: {
                            kind: commandKinds.CommentUpdate,
                            commandId,
                            commentId,
                            newBody: trimmed,
                            at,
                        },
                        undo: {
                            kind: commandKinds.CommentUpdate,
                            commentId,
                            prevBody: cur.body,
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
