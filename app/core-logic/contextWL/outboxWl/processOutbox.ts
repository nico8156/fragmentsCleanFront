import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import {
	dequeueCommitted,
	dropCommitted,
	markAwaitingAck,
	markFailed,
	markProcessing,
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

import {
	selectOutboxById,
	selectOutboxQueue,
} from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";

import { likeRollback } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import type { LikeUndo } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { ticketRollBack } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";

import {
	createRollback,
	deleteRollback,
	updateRollback,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";

import { computeNextAttemptAtMs } from "@/app/core-logic/contextWL/outboxWl/utils/computeNextAttemptAtMs";
import { logger } from "@/app/core-logic/utils/logger";

const isSignedIn = (s: RootStateWl) => s.aState?.status === "signedIn";

const getAuthedUserId = (s: RootStateWl): string | undefined =>
	s.aState?.session?.userId ?? (s.aState as any)?.currentUser?.id ?? undefined;

const isCommentCreateUndo = (
	u: unknown,
): u is { tempId: string; targetId: string; parentId?: string } => {
	const x = u as any;
	return !!x && typeof x.tempId === "string" && typeof x.targetId === "string";
};

const ackByIsoIn30s = () => new Date(Date.now() + 30_000).toISOString();

const getNextAttemptAtMs = (rec: any): number | undefined => {
	// compat: ancien champ nextAttemptAt / nouveau nextAttemptAtMs
	const a = rec?.nextAttemptAt;
	if (typeof a === "number" && Number.isFinite(a)) return a;
	const b = rec?.nextAttemptAtMs;
	if (typeof b === "number" && Number.isFinite(b)) return b;
	return undefined;
};

export const processOutboxFactory = (deps: DependenciesWl, callback?: () => void) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	let inFlight = false;

	listen({
		actionCreator: outboxProcessOnce,
		effect: async (_action, api) => {
			if (inFlight) {
				logger.debug("[OUTBOX] processOnce: skipped (already running)");
				return;
			}

			inFlight = true;
			try {
				const state = api.getState();

				if (state.oState?.suspended) {
					logger.debug("[OUTBOX] processOnce: skipped (suspended)");
					return;
				}

				if (!isSignedIn(state)) {
					logger.debug("[OUTBOX] processOnce: skipped (not signedIn)");
					return;
				}

				const authedUserId = getAuthedUserId(state);
				if (!authedUserId) {
					logger.debug("[OUTBOX] processOnce: skipped (signedIn but no userId yet)");
					return;
				}

				const token = await deps.gateways?.authToken?.getAccessToken?.();
				if (!token) {
					logger.debug("[OUTBOX] processOnce: skipped (no token)");
					return;
				}

				const queue: OutboxStateWl["queue"] = selectOutboxQueue(state);
				if (!queue.length) {
					logger.debug("[OUTBOX] processOnce: skipped (queue empty)");
					return;
				}

				const byId: OutboxStateWl["byId"] = selectOutboxById(state);
				const nowMs = Date.now();

				const eligibleId = queue.find((qid) => {
					const rec = byId[qid];
					if (!rec) return false;
					if (rec.status !== statusTypes.queued) return false;

					const nextAttemptAt = getNextAttemptAtMs(rec as any);
					if (nextAttemptAt && nextAttemptAt > nowMs) return false;

					return true;
				});

				if (!eligibleId) {
					logger.debug("[OUTBOX] processOnce: no eligible record");
					return;
				}

				const id = eligibleId;
				const record = byId[id];

				if (!record) {
					logger.warn("[OUTBOX] processOnce: record missing, dequeuing", { id });
					api.dispatch(dequeueCommitted({ id }));
					return;
				}

				const item = record.item as OutboxItem;
				const cmd = item.command;

				// ---- resolve gateway once, and ALWAYS use it ----
				const resolveGateway = (kind: string) => {
					switch (kind) {
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

				const gw: any = resolveGateway(cmd.kind as any);

				// ✅ missing gateway => deterministic drop (matches your test)
				if (!gw) {
					logger.error("[OUTBOX] processOnce: no gateway for command kind, dropping", {
						id,
						kind: cmd.kind,
						commandId: (cmd as any).commandId,
					});
					api.dispatch(markFailed({ id, error: "no gateway" }));
					api.dispatch(dequeueCommitted({ id }));
					api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
					return;
				}

				const sentAndAwaitAck = () => {
					const iso = ackByIsoIn30s();

					// compat: ancien payload ackBy / nouveau ackByIso
					api.dispatch(markAwaitingAck({ id, ackByIso: iso } as any));
					api.dispatch(dequeueCommitted({ id }));
					api.dispatch(outboxAwaitingAckAdded({ id }));
				};

				api.dispatch(markProcessing({ id }));

				logger.info("[OUTBOX] processOnce: processing", {
					id,
					kind: cmd.kind,
					commandId: (cmd as any).commandId,
				});

				try {
					switch (cmd.kind) {
						case commandKinds.LikeAdd:
							await gw.add({
								commandId: cmd.commandId,
								targetId: cmd.targetId,
								at: cmd.at,
							});
							sentAndAwaitAck();
							break;

						case commandKinds.LikeRemove:
							await gw.remove({
								commandId: cmd.commandId,
								targetId: cmd.targetId,
								at: cmd.at,
							});
							sentAndAwaitAck();
							break;

						case commandKinds.CommentCreate:
							await gw.create({
								commandId: cmd.commandId,
								targetId: cmd.targetId,
								parentId: cmd.parentId ?? null,
								body: cmd.body,
								tempId: cmd.tempId,
							});
							sentAndAwaitAck();
							break;

						case commandKinds.CommentUpdate:
							await gw.update({
								commandId: cmd.commandId,
								commentId: cmd.commentId,
								body: cmd.newBody,
								editedAt: cmd.at,
							});
							sentAndAwaitAck();
							break;

						case commandKinds.CommentDelete:
							await gw.delete({
								commandId: cmd.commandId,
								commentId: cmd.commentId,
								deletedAt: cmd.at,
							});
							sentAndAwaitAck();
							break;

						case commandKinds.TicketVerify:
							await gw.verify({
								commandId: cmd.commandId,
								ticketId: cmd.ticketId,
								imageRef: cmd.imageRef,
								ocrText: cmd.ocrText ?? null,
								at: cmd.at,
							});
							sentAndAwaitAck();
							break;

						default:
							logger.warn("[OUTBOX] processOnce: unknown command kind, dropping", {
								id,
								kind: (cmd as any).kind,
								commandId: (cmd as any).commandId,
							});
							api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
							api.dispatch(dequeueCommitted({ id }));
							break;
					}
				} catch (e: any) {
					logger.error("[OUTBOX] processOnce: error", {
						id,
						kind: item.command.kind,
						commandId: item.command.commandId,
						error: e?.message ?? String(e),
					});

					// rollback
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
								logger.warn("[OUTBOX] CommentCreate undo shape mismatch", { undo: u });
							}
							break;
						}

						case commandKinds.CommentUpdate: {
							const u = item.undo as { commentId: string; prevBody: string; prevVersion?: number };
							api.dispatch(updateRollback({ commentId: u.commentId, prevBody: u.prevBody, prevVersion: u.prevVersion }));
							break;
						}

						case commandKinds.CommentDelete: {
							const u = item.undo as { commentId: string; prevBody: string; prevVersion?: number; prevDeletedAt?: string };
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

					const stateAfterFail = api.getState();
					const attemptsSoFar = selectOutboxById(stateAfterFail)[id]?.attempts ?? 0;

					const nextAttemptAtMs = computeNextAttemptAtMs({
						attemptsSoFar,
						nowMs: Date.now(),
					});

					// compat: ton action semble être nextAttemptAtMs
					api.dispatch(scheduleRetry({ id, nextAttemptAtMs } as any));
				}

				callback?.();
			} finally {
				inFlight = false;
			}
		},
	});

	listen({
		actionCreator: outboxSuspendRequested,
		effect: async (_action, api) => {
			const pendingCount = Object.keys(api.getState().oState?.byId ?? {}).length;
			logger.info("[OUTBOX] suspend requested", {
				pendingCount,
				timestamp: new Date().toISOString(),
			});
		},
	});

	return mw;
};
