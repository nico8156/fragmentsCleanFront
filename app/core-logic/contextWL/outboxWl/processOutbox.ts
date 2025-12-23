import { createAction, createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { DependenciesWl } from "@/app/store/appStateWl";
import { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

import {
    markProcessing,
    markFailed,
    markAwaitingAck,
    dequeueCommitted,
    dropCommitted,
    outboxProcessOnce,
    outboxSuspendRequested,
    scheduleRetry,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { outboxAwaitingAckAdded } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";

import {
    commandKinds,
    OutboxItem,
    OutboxStateWl,
    statusTypes,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import { LikeUndo } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { likeRollback } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { ticketRollBack } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";

import {
    selectOutboxById,
    selectOutboxQueue,
} from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import {
    createRollback,
    deleteRollback,
    updateRollback
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";

const isSignedIn = (s: RootStateWl) => s.aState?.status === "signedIn";

const getAuthedUserId = (s: RootStateWl): string | undefined => {
    const fromSession = s.aState?.session?.userId;
    if (fromSession) return fromSession;
    const fromUser = (s.aState as any)?.currentUser?.id;
    return fromUser ?? undefined;
};

const isCommentCreateUndo = (u: any): u is { tempId: string; targetId: string; parentId?: string } => {
    return !!u && typeof u.tempId === "string" && typeof u.targetId === "string";
};

export const processOutboxFactory = (deps: DependenciesWl, callback?: () => void) => {
    const processOutboxUseCase = createListenerMiddleware();
    const listener = processOutboxUseCase.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    // ✅ mutex anti-concurrence
    let inFlight = false;

    listener({
        actionCreator: outboxProcessOnce,
        effect: async (_action, api) => {
            if (inFlight) {
                console.log("[OUTBOX] processOnce: skipped (already running)");
                return;
            }

            inFlight = true;
            try {
                const state = api.getState() as RootStateWl;

                // ✅ garde auth : pas d'outbox write si pas signedIn
                if (!isSignedIn(state)) {
                    console.log("[OUTBOX] processOnce: skipped (not signedIn)");
                    return;
                }

                const authedUserId = getAuthedUserId(state);
                if (!authedUserId) {
                    console.log("[OUTBOX] processOnce: skipped (signedIn but no userId yet)");
                    return;
                }

                const token = await deps.gateways.authToken?.getAccessToken?.();
                if (!token) {
                    console.log("[OUTBOX] processOnce: skipped (no token)");
                    return;
                }

                const queue: OutboxStateWl["queue"] = selectOutboxQueue(state);
                if (!queue.length) {
                    console.log("[OUTBOX] processOnce: skipped (queue empty)");
                    return;
                }

                const byId: OutboxStateWl["byId"] = selectOutboxById(state);
                const now = Date.now();

                const eligibleId = queue.find((qid: string) => {
                    const rec = byId[qid];
                    if (!rec) return false;
                    if (rec.status !== statusTypes.queued) return false;
                    if (rec.nextAttemptAt && rec.nextAttemptAt > now) return false;
                    return true;
                });

                if (!eligibleId) {
                    console.log("[OUTBOX] processOnce: no eligible record (waiting for retry / not queued)");
                    return;
                }

                const id = eligibleId;
                const record = byId[id];

                if (!record) {
                    console.warn("[OUTBOX] processOnce: record missing, dequeuing", { id });
                    api.dispatch(dequeueCommitted({ id }));
                    return;
                }

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
                    console.error("[OUTBOX] processOnce: no gateway for command kind, dropping", {
                        id,
                        kind: cmd.kind,
                        commandId: (cmd as any).commandId,
                    });
                    api.dispatch(markFailed({ id, error: "no gateway" }));
                    api.dispatch(dequeueCommitted({ id }));
                    api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
                    return;
                }

                api.dispatch(markProcessing({ id }));

                console.log("[OUTBOX] processOnce: processing", {
                    id,
                    kind: cmd.kind,
                    commandId: (cmd as any).commandId,
                });

                try {
                    switch (cmd.kind) {
                        case commandKinds.LikeAdd: {
                            await deps.gateways.likes!.add({
                                commandId: cmd.commandId,
                                targetId: cmd.targetId,
                                at: cmd.at,
                            });
                            api.dispatch(markAwaitingAck({ id, ackBy: new Date(Date.now() + 30_000).toISOString() }));
                            api.dispatch(dequeueCommitted({ id }));
                            api.dispatch(outboxAwaitingAckAdded({ id })); // ✅ hint watchdog

                            break;
                        }

                        case commandKinds.LikeRemove: {
                            await deps.gateways.likes!.remove({
                                commandId: cmd.commandId,
                                targetId: cmd.targetId,
                                at: cmd.at,
                            });
                            api.dispatch(markAwaitingAck({ id, ackBy: new Date(Date.now() + 30_000).toISOString() }));
                            api.dispatch(dequeueCommitted({ id }));
                            api.dispatch(outboxAwaitingAckAdded({ id })); // ✅ hint watchdog

                            break;
                        }

                        case commandKinds.CommentCreate: {
                            await deps.gateways.comments!.create({
                                commandId: cmd.commandId,
                                targetId: cmd.targetId,
                                parentId: cmd.parentId ?? null,
                                body: cmd.body,
                                tempId: cmd.tempId,
                            });
                            api.dispatch(markAwaitingAck({ id, ackBy: new Date(Date.now() + 30_000).toISOString() }));
                            api.dispatch(dequeueCommitted({ id }));
                            api.dispatch(outboxAwaitingAckAdded({ id })); // ✅ hint watchdog

                            break;
                        }

                        case commandKinds.CommentUpdate: {
                            await deps.gateways.comments!.update({
                                commandId: cmd.commandId,
                                commentId: cmd.commentId,
                                body: cmd.newBody,
                                editedAt: cmd.at,
                            });
                            api.dispatch(markAwaitingAck({ id, ackBy: new Date(Date.now() + 30_000).toISOString() }));
                            api.dispatch(dequeueCommitted({ id }));
                            api.dispatch(outboxAwaitingAckAdded({ id })); // ✅ hint watchdog

                            break;
                        }

                        case commandKinds.CommentDelete: {
                            await deps.gateways.comments!.delete({
                                commandId: cmd.commandId,
                                commentId: cmd.commentId,
                                deletedAt: cmd.at,
                            });
                            api.dispatch(markAwaitingAck({ id, ackBy: new Date(Date.now() + 30_000).toISOString() }));
                            api.dispatch(dequeueCommitted({ id }));
                            api.dispatch(outboxAwaitingAckAdded({ id })); // ✅ hint watchdog

                            break;
                        }

                        case commandKinds.TicketVerify: {
                            await deps.gateways.tickets!.verify({
                                commandId: cmd.commandId,
                                ticketId: cmd.ticketId,
                                imageRef: cmd.imageRef,
                                ocrText: cmd.ocrText ?? null,
                                at: cmd.at,
                            });
                            api.dispatch(markAwaitingAck({ id, ackBy: new Date(Date.now() + 30_000).toISOString() }));
                            api.dispatch(dequeueCommitted({ id }));
                            api.dispatch(outboxAwaitingAckAdded({ id })); // ✅ hint watchdog

                            break;
                        }

                        default: {
                            console.warn("[OUTBOX] processOnce: unknown command kind, dropping", {
                                id,
                                kind: (cmd as any).kind,
                                commandId: (cmd as any).commandId,
                            });
                            api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
                            api.dispatch(dequeueCommitted({ id }));
                            break;
                        }
                    }
                } catch (e: any) {
                    console.error("[OUTBOX] processOnce: error", {
                        id,
                        kind: (record.item as OutboxItem).command.kind,
                        commandId: (record.item as OutboxItem).command.commandId,
                        error: e?.message ?? String(e),
                    });

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
                                }),
                            );
                            break;
                        }

                        case commandKinds.CommentCreate: {
                            const u = item.undo;
                            if (isCommentCreateUndo(u)) {
                                api.dispatch(createRollback({ tempId: u.tempId, targetId: u.targetId, parentId: u.parentId }));
                            } else {
                                console.warn("[OUTBOX] CommentCreate undo shape mismatch", { undo: u });
                            }
                            break;
                        }

                        case commandKinds.CommentUpdate: {
                            const u = item.undo as { commentId: string; prevBody: string; prevVersion?: number };
                            api.dispatch(updateRollback({ commentId: u.commentId, prevBody: u.prevBody, prevVersion: u.prevVersion }));
                            break;
                        }

                        case commandKinds.CommentDelete: {
                            const u = item.undo as {
                                commentId: string;
                                prevBody: string;
                                prevVersion?: number;
                                prevDeletedAt?: string;
                            };
                            api.dispatch(
                                deleteRollback({
                                    commentId: u.commentId,
                                    prevBody: u.prevBody,
                                    prevVersion: u.prevVersion,
                                    prevDeletedAt: u.prevDeletedAt,
                                }),
                            );
                            break;
                        }

                        case commandKinds.TicketVerify: {
                            const u = item.undo as { ticketId: string };
                            api.dispatch(ticketRollBack({ ticketId: u.ticketId }));
                            break;
                        }

                        default:
                            break;
                    }

                    api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));

                    const stateAfterFail = api.getState() as RootStateWl;
                    const attemptsSoFar = selectOutboxById(stateAfterFail)[id]?.attempts ?? 0;

                    const base = Math.min(60_000, 2 ** Math.min(attemptsSoFar, 6) * 1000);
                    const jitter = Math.floor(Math.random() * 300);
                    const next = Date.now() + base + jitter;

                    api.dispatch(scheduleRetry({ id, nextAttemptAt: next }));
                }

                if (callback) callback();
            } finally {
                inFlight = false;
            }
        },
    });

    listener({
        actionCreator: outboxSuspendRequested,
        effect: async (_, api) => {
            const state = api.getState();
            const pendingCount = Object.keys((state as any).oState?.byId ?? {}).length;

            console.log("[OUTBOX] suspend requested (app background)", {
                pendingCount,
                timestamp: new Date().toISOString(),
            });
        },
    });

    return processOutboxUseCase;
};
