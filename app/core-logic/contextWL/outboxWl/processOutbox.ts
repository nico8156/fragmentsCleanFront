import {createAction, createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {outboxProcessOnce} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {commandKinds, OutboxItem, statusTypes} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {LikeUndo} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import {likeRollback} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import {ticketRollBack} from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";

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
            const id = queue[0]
            if (!id) return

            const record = (api.getState()as any ).oState.byId[id]

            if (!record) {
                // garde-fou: nettoie si incohérent
                api.dispatch(dequeueCommitted({ id }));
                return;
            }

            // on ne traite que les "queued" (si déjà processing, on s'arrête)
            if (record.status !== statusTypes.queued) return;

            const cmd = (record.item as OutboxItem).command;

            const need = (k: string) => {
                switch (k) {
                    case commandKinds.LikeAdd:
                    case commandKinds.LikeRemove:
                        return deps.gateways?.likes;
                    case commandKinds.CommentCreate:
                    case commandKinds.CommentUpdate:
                    case commandKinds.CommentDelete:
                        return deps.gateways?.comments;
                    case commandKinds.TicketVerify:
                        return deps.gateways?.tickets;
                    default:
                        return null;
                }
            };

            const gw = need(cmd.kind as any);

            if (!gw) {
                api.dispatch(markFailed({ id, error: "no GW" }));
                api.dispatch(dequeueCommitted({ id }));
                api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
                return
            }

            api.dispatch(markProcessing({ id }));

            try {
                switch (cmd.kind) {
                    // ===== Likes =====
                    case commandKinds.LikeAdd: {
                        const userId = (cmd as any).userId ?? deps.helpers?.currentUserId?.() ?? "anonymous";
                        await deps.gateways.likes!.add({
                            commandId: cmd.commandId,
                            targetId: cmd.targetId,
                            userId,
                            at: cmd.at,
                        });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now() + 30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    case commandKinds.LikeRemove: {
                        const userId = (cmd as any).userId ?? deps.helpers?.currentUserId?.() ?? "anonymous";
                        await deps.gateways.likes!.remove({
                            commandId: cmd.commandId,
                            targetId: cmd.targetId,
                            userId,
                            at: cmd.at,
                        });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now() + 30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    // ===== Comments =====
                    case commandKinds.CommentCreate: {
                        await deps.gateways.comments!.create({
                            commandId: cmd.commandId,
                            targetId: cmd.targetId,
                            parentId: cmd.parentId,
                            body: cmd.body,
                            tempId: cmd.tempId,
                        });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now() + 30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    case commandKinds.CommentUpdate: {
                        await deps.gateways.comments!.update({
                            commandId: cmd.commandId,
                            commentId: cmd.commentId,
                            body: cmd.newBody,
                            updatedAt: cmd.at,
                        });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now() + 30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }
                    case commandKinds.CommentDelete: {
                        await deps.gateways.comments!.delete({
                            commandId: cmd.commandId,
                            commentId: cmd.commentId,
                            deletedAt: cmd.at,
                        });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now() + 30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }

                    // ===== Tickets =====
                    case commandKinds.TicketVerify: {
                        await deps.gateways.tickets!.verify({
                            commandId: cmd.commandId,
                            ticketId: cmd.ticketId,
                            imageRef: cmd.imageRef,
                            ocrText: cmd.ocrText ?? null,
                            at: cmd.at,
                        });
                        const ackBy = deps.helpers?.nowIso?.() ?? new Date(Date.now() + 30_000).toISOString();
                        api.dispatch(markAwaitingAck({ id, ackBy }));
                        api.dispatch(dequeueCommitted({ id }));
                        break;
                    }

                    default: {
                        // commande inconnue → drop soft
                        api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
                        api.dispatch(dequeueCommitted({ id }));
                    }
                }
            } catch (e: any) {
                const item = record.item as OutboxItem;

                switch (item.command.kind) {
                    case commandKinds.LikeAdd:
                    case commandKinds.LikeRemove: {
                        const u = item.undo as LikeUndo;
                        api.dispatch(
                            likeRollback({
                                targetId: u.targetId,
                                prevCount: u.prevCount,
                                prevMe: u.prevMe,
                                prevVersion: u.prevVersion,
                            })
                        );
                        break;
                    }
                    case commandKinds.CommentCreate: {
                        const u = item.undo as { tempId: string; targetId: string; parentId?: string };
                        api.dispatch(createRollback({ tempId: u.tempId, targetId: u.targetId, parentId: u.parentId }));
                        break;
                    }
                    case commandKinds.CommentUpdate: {
                        const u = item.undo as { commentId: string; prevBody: string; prevVersion?: number };
                        api.dispatch(updateRollback({ commentId: u.commentId, prevBody: u.prevBody, prevVersion: u.prevVersion }));
                        break;
                    }
                    case commandKinds.CommentDelete: {
                        const u = item.undo as { commentId: string; prevBody: string; prevVersion?: number; prevDeletedAt?: string };
                        api.dispatch(deleteRollback({ commentId: u.commentId, prevBody: u.prevBody, prevVersion: u.prevVersion, prevDeletedAt: u.prevDeletedAt }));
                        break;
                    }
                    case commandKinds.TicketVerify: {
                        const u = item.undo as { ticketId: string };
                        // rollback local: on supprime l’agg optimistic (ou set REJECTED si tu préfères)
                        api.dispatch(ticketRollBack({ ticketId: u.ticketId }));
                        break;
                    }
                    default:
                        // noop
                        break;
                }

                api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));
                api.dispatch(dequeueCommitted({ id }));
            }

            if (callback) callback();
        },
    })
    return processOutboxUseCase;
}