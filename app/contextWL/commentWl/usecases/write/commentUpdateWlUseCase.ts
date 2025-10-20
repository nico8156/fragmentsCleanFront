import {createAction, createListenerMiddleware, nanoid, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {enqueueCommitted, outboxProcessOnce} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {commandKinds} from "@/app/contextWL/outboxWl/type/outbox.type";

export const cuAction = createAction<{ commentId: string; newBody: string }>("UI/COMMENT/UPDATE")
export const updateOptimisticApplied  = createAction<{ commentId: string; newBody: string; clientEditedAt: string; }>("COMMENT/UPDATE_OPTIMISTIC")

export const commentUpdateWlUseCase = (deps:DependenciesWl, callback?:()=> void) => {
    const cuUseCase = createListenerMiddleware()
    const listener = cuUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator:cuAction,
        effect: async (action, api) => {
            const {commentId, newBody} = action.payload
            const trimmed = newBody.trim();
            if (!trimmed) {
                if (callback) {
                    callback();
                }
                return
            };

            const state = api.getState() as any;
            const c = state.cState.entities.entities[commentId];
            if (!c){
                if (callback) {
                    callback();
                }
                return;
            }

            const commandId = `cmd_${nanoid()}`;
            const outboxId  = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
            const updatedAt = deps.helpers?.nowIso?.() ?? new Date().toISOString();
            // 1) optimistic
            api.dispatch(updateOptimisticApplied({ commentId, newBody: trimmed, clientEditedAt: updatedAt }));
            // 2) enqueue
            api.dispatch(enqueueCommitted({
                id: outboxId,
                item: {
                    command: { kind: commandKinds.CommentUpdate, commandId, commentId, body: trimmed, createdAt:updatedAt },
                    undo:    { kind: commandKinds.CommentUpdate, commentId, prevBody: c.body },
                },
                enqueuedAt: updatedAt,
            }));
            //dispatch du process de l'outbox !
            api.dispatch(outboxProcessOnce())
            if (callback) {
                callback();
            }
        }
    })
    return cuUseCase;
};