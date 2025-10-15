import {createAction, createListenerMiddleware, nanoid, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {enqueueCommitted, outboxProcessOnce} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";

export const cuAction = createAction<{ targetId: string,commentId: string; newBody: string }>("UI/COMMENT/UPDATE")
export const updateOptimisticApplied  = createAction<{ commentId: string; newBody: string; clientEditedAt: string; }>("COMMENT/UPDATE_OPTIMISTIC")

export const commentUpdateWlUseCase = (deps:DependenciesWl, callback?:()=> void) => {
    const cuUseCase = createListenerMiddleware()
    const listener = cuUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator:cuAction,
        effect: async (action, api) => {
            const {targetId,commentId, newBody} = action.payload
            const trimmed = newBody.trim();
            if (!trimmed) return;
            // continue if body

            const state = api.getState() as any;
            const c = state.cState.entities.entities[commentId];
            if (!c) return;
            // continue if prev

            const commandId = `cmd_${nanoid()}`;
            const tempId = deps.helpers.getCommentIdForTests?.() ?? `cmt_tmp_${nanoid()}`;
            const outboxId  = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
            const updatedAt = deps.helpers?.nowIso?.() ?? new Date().toISOString();

            // 1) optimistic
            api.dispatch(updateOptimisticApplied({ commentId, newBody: trimmed, clientEditedAt: updatedAt }));

            // 2) enqueue
            api.dispatch(enqueueCommitted({
                id: outboxId,
                item: {
                    command: { kind: commandKinds.CommentUpdate, commandId, tempId, targetId, body:trimmed, createdAt:updatedAt },
                    undo:    { kind: commandKinds.CommentUpdate, tempId, targetId, prevBody:c.body},
                },
                enqueuedAt: updatedAt,
            }));

            // 3) kick worker
            api.dispatch(outboxProcessOnce());

            if (callback) {
                callback();
            }
        }
    })
    return cuUseCase;
};