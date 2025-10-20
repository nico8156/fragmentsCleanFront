import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {outboxProcessOnce} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {commandKinds, OutboxItem, statusTypes} from "@/app/contextWL/outboxWl/type/outbox.type";
import {LikeUndo} from "@/app/contextWL/likeWl/typeAction/likeWl.type";
import {likeRollback} from "@/app/contextWL/likeWl/typeAction/likeWl.action";

export const markProcessing = createAction<{id:string}>("OUTBOX/MARK_PROCESSING")
export const createReconciled = createAction<{ tempId: string; server: { id: string; createdAt: string; version: number }}>("COMMENT/CREATE_RECONCILED")
export const markFailed = createAction<{id: string, error: string}>("OUTBOX/MARK_FAILED")
export const createRollback = createAction<{ tempId: string; targetId: string; parentId?: string }>("COMMENT/CREATE_ROLLBACK")
export const markAwaitingAck = createAction<{id: string, ackBy?: string}>("OUTBOX/MARK_AWAITING_ACK")
export const dequeueCommitted = createAction<{id: string}>("OUTBOX/DEQUEUE_COMMITTED")
export const dropCommitted    = createAction<{ commandId: string }>("OUTBOX/DROP_COMMITTED")
export const updateRollback= createAction<{ commentId?: string; prevBody?: string; prevVersion?: number }>("COMMENT/UPDATE_ROLLBACK");
export const deleteRollback = createAction<{ commentId: string; prevBody: string; prevVersion?: number; prevDeletedAt?: string }>("COMMENT/DELETE_ROLLBACK");

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

            if(!deps.gateways.likes) return;
            api.dispatch(markProcessing({ id }));
            try {
                const cmd = record.item.command;
                switch (cmd.kind) {
                    case commandKinds.LikeAdd: {
                        await deps.gateways.likes.add({ commandId: cmd.commandId, targetId: cmd.targetId, userId: cmd.userId, at: cmd.at });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now()+30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    case commandKinds.LikeRemove: {
                        await deps.gateways.likes.remove({ commandId: cmd.commandId, targetId: cmd.targetId, userId: cmd.userId, at: cmd.at });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now()+30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
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
                    case commandKinds.CommentDelete: {
                        await deps.gateways.comments.delete({
                            commandId: cmd.commandId,
                            commentId: cmd.commentId,
                            deletedAt: cmd.deletedAt,
                        });

                        const ackBy =
                            deps.helpers?.nowIso?.() ??
                            new Date(Date.now() + 30_000).toISOString();
                        // succès REST → on attend l’ACK : awaitingAck + dequeue
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    default:
                        // commande non supportée: on “ drop”
                        api.dispatch(dropCommitted({ commandId: cmd.commandId }));
                        api.dispatch(dequeueCommitted({ id }));
                }
            } catch (e: any) {
                // échec: rollback + fail + drop (simple pour l’instant)
                const cmd = record.item as OutboxItem;
                if (cmd.command.kind === commandKinds.LikeAdd || cmd.command.kind === commandKinds.LikeRemove) {
                    const u = record.item.undo as LikeUndo;
                    api.dispatch(likeRollback({ targetId: u.targetId, prevCount: u.prevCount, prevMe: u.prevMe, prevVersion: u.prevVersion }));
                }
                if (cmd.command.kind === commandKinds.CommentCreate) {
                    api.dispatch(createRollback({
                            tempId: cmd.command.tempId!,
                            targetId: cmd.command.targetId!,
                            parentId: cmd.command.parentId,
                        })
                    );
                }
                if (cmd.command.kind === commandKinds.CommentUpdate) {

                    api.dispatch(updateRollback({
                        commentId: cmd.command.commentId,
                        prevBody:  cmd.undo.prevBody,
                        prevVersion: cmd.undo.prevVersion,
                    }));
                }
                if (cmd.command.kind === commandKinds.CommentDelete) {
                    const u = record.item.undo
                    api.dispatch(deleteRollback({
                        commentId: u.commentId,
                        prevBody: u.prevBody,
                        prevVersion: u.prevVersion,
                        prevDeletedAt: u.prevDeletedAt,
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