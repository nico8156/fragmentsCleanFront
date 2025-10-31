import {createAction, createListenerMiddleware, nanoid, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {enqueueCommitted, outboxProcessOnce} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {commandKinds} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";

export const uiCommentDeleteRequested = createAction<{ commentId: string }>('UI/COMMENT/DELETE_REQUESTED');
export const deleteOptimisticApplied = createAction<{ commentId: string; clientDeletedAt: string }>('COMMENT/DELETE_OPTIMISTIC_APPLIED');

export const commentDeleteUseCaseFactory = (deps: DependenciesWl, callback?:()=> void) => {
    const mw = createListenerMiddleware();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator: uiCommentDeleteRequested,
        effect: async ({ payload: { commentId } }, api) => {
            const state: any = api.getState();
            const cur = state.cState.entities.entities[commentId];
            if (!cur) {
                if (callback) {
                    callback();
                }
                return;
            }; // rien à faire
            // (Option) : si le commentaire est encore "optimistic" non réconcilié,
            // tu peux choisir d'annuler la création plutôt que d'envoyer un delete serveur.
            // Ici on part sur un delete standard.

            const commandId = `cmd_${nanoid()}`;
            const outboxId  = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
            const deletedAt = deps.helpers?.nowIso?.() ?? new Date().toISOString();

            // 1) optimistic
            api.dispatch(deleteOptimisticApplied({ commentId, clientDeletedAt: deletedAt }));

            // 2) enqueue
            api.dispatch(enqueueCommitted({
                id: outboxId,
                item: {
                    command: { kind: commandKinds.CommentDelete, commandId, commentId, at:deletedAt },
                    undo:    {
                        kind: commandKinds.CommentDelete,
                        commentId,
                        prevBody: cur.body,
                        prevVersion: cur.version,
                        prevDeletedAt: cur.deletedAt,
                    },
                },
                enqueuedAt: deletedAt,
            }));
            // 3) worker
            api.dispatch(outboxProcessOnce());

            if (callback) {
                callback();
            }
        }
    });

    return mw;
};
