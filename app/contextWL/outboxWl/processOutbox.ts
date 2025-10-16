import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {outboxProcessOnce} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {commandKinds, statusTypes} from "@/app/contextWL/outboxWl/outbox.type";

export const markProcessing = createAction<{id:string}>("OUTBOX/MARK_PROCESSING")
export const createReconciled = createAction<{ tempId: string; server: { id: string; createdAt: string; version: number }}>("COMMENT/CREATE_RECONCILED")
export const markFailed = createAction<{id: string, error: string}>("OUTBOX/MARK_FAILED")
export const createRollback = createAction<{ tempId: string; targetId: string; parentId?: string }>("COMMENT/CREATE_ROLLBACK")
export const markAwaitingAck = createAction<{id: string, ackBy?: string}>("OUTBOX/MARK_AWAITING_ACK")
export const dequeueCommitted = createAction<{id: string}>("OUTBOX/DEQUEUE_COMMITTED")
export const dropCommitted    = createAction<{ id: string }>("OUTBOX/DROP_COMMITTED")
export const updateRollback= createAction<{ commentId: string; prevBody: string; prevVersion?: number }>("COMMENT/UPDATE_ROLLBACK");

export const processOutboxFactory = (deps:DependenciesWl, callback?: () => void) => {
    const processOutboxUseCase = createListenerMiddleware();
    const listener = processOutboxUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator:outboxProcessOnce,
        effect: async (action, api)=>{
            const {queue} = (api.getState() as any).oState
            // if (!outbox || !Array.isArray(outbox.queue)) return;
            // const queue: string[] = outbox.queue;
            const id = queue[0];
            if (!id) return; // rien à faire

            const record = (api.getState()as any ).oState.byId[id];
            if (!record) {
                // garde-fou: nettoie si incohérent
                api.dispatch(dequeueCommitted({ id }));
                return;
            }
            // on ne traite que les "queued" (si déjà processing, on s'arrête)
            if (record.status !== statusTypes.queued) return;
            if(!deps.gateways.comments) return;
            api.dispatch(markProcessing({ id }));
            try {
                const cmd = record.item.command;
                switch (cmd.kind) {
                    case commandKinds.CommentCreate: {
                        await deps.gateways.comments.create({
                                commandId: cmd.commandId,
                                targetId: cmd.targetId,
                                parentId: cmd.parentId,
                                body: cmd.body,
                        })
                        const ackBy =
                            deps.helpers?.nowIso?.() ??
                            new Date(Date.now() + 30_000).toISOString(); // optionnel
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        // pas de reconcile ici
                        break;
                    }
                    case commandKinds.CommentUpdate:{
                        await deps.gateways.comments.update({
                            commandId: cmd.commandId,
                            commentId: cmd.commentId,
                            body: cmd.newBody,
                            updatedAt: cmd.updatedAt,
                        });
                        const ackBy =
                            deps.helpers?.nowIso?.() ??
                            new Date(Date.now() + 30_000).toISOString();
                        // succès REST → on attend l’ACK : awaitingAck + dequeue
                        api.dispatch(markAwaitingAck({ id, ackBy}));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    default:
                        // commande non supportée: on “ drop”
                        api.dispatch(dropCommitted({ id }));
                        api.dispatch(dequeueCommitted({ id }));
                }
            } catch (e: any) {
                // échec: rollback + fail + drop (simple pour l’instant)
                const cmd = record.item.command;
                if (cmd.kind === commandKinds.CommentCreate) {
                    api.dispatch(createRollback({
                            tempId: cmd.tempId,
                            targetId: cmd.targetId,
                            parentId: cmd.parentId,
                        })
                    );
                }
                if (cmd.kind === commandKinds.CommentUpdate) {
                    api.dispatch(updateRollback({
                        commentId: cmd.commentId,
                        prevBody:  cmd.undo.prevBody,
                        prevVersion: cmd.undo.prevVersion,
                    }));
                }
                api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));
                api.dispatch(dequeueCommitted({ id }));
            }
            if (callback) {
                callback();
                return;
            }
        }
    })
    return processOutboxUseCase;
}