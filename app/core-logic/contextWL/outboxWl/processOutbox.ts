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
	OutboxItem,
	OutboxStateWl,
	statusTypes,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import {
	selectOutboxById,
	selectOutboxQueue,
} from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";

import {
	getOutboxCommandGateway,
	rollbackRejectedOutboxRecord,
	sendOutboxCommand,
} from "@/app/core-logic/contextWL/outboxWl/commandHandlers/outboxCommandHandlers";
import { outboxTelemetry } from "@/app/core-logic/contextWL/outboxWl/observation/outboxObservability";

import { computeNextAttemptAtMs } from "@/app/core-logic/contextWL/outboxWl/utils/computeNextAttemptAtMs";
import { isGatewayError } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";
import { logger } from "@/app/core-logic/utils/logger";

const hasSession = (s: RootStateWl) => Boolean(s.aState?.session?.userId);

const getAuthedUserId = (s: RootStateWl): string | undefined =>
	s.aState?.session?.userId ?? (s.aState as any)?.currentUser?.id ?? undefined;

const ackByIsoIn30s = () => new Date(Date.now() + 30_000).toISOString();

const getNextAttemptAtMs = (rec: any): number | undefined => {
	// compat: ancien champ nextAttemptAt / nouveau nextAttemptAtMs
	const a = rec?.nextAttemptAt;
	if (typeof a === "number" && Number.isFinite(a)) return a;
	const b = rec?.nextAttemptAtMs;
	if (typeof b === "number" && Number.isFinite(b)) return b;
	return undefined;
};

const isExplicitBusinessRejection = (e: unknown): boolean => {
	if (isGatewayError(e)) return e.kind === "business";

	const message = String((e as any)?.message ?? e ?? "").toLowerCase();
	if (message.includes("rejected") || message.includes("business rejection")) return true;
	return false;
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

				if (!hasSession(state)) {
					logger.debug("[OUTBOX] processOnce: skipped (no session)");
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

				const gw = getOutboxCommandGateway(deps.gateways, cmd.kind as any);

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
					outboxTelemetry.awaitingAck(record, iso);
				};

				api.dispatch(markProcessing({ id }));
				outboxTelemetry.enqueuedForSend(record);

				logger.info("[OUTBOX] processOnce: processing", {
					id,
					kind: cmd.kind,
					commandId: (cmd as any).commandId,
				});

				try {
					const sendResult = await sendOutboxCommand({ command: cmd, gateway: gw });
					if (sendResult === "sent") {
						sentAndAwaitAck();
					} else {
						logger.warn("[OUTBOX] processOnce: unknown command kind, dropping", {
							id,
							kind: (cmd as any).kind,
							commandId: (cmd as any).commandId,
						});
						api.dispatch(dropCommitted({ commandId: (cmd as any).commandId }));
						api.dispatch(dequeueCommitted({ id }));
					}
				} catch (e: any) {
					logger.error("[OUTBOX] processOnce: error", {
						id,
						kind: item.command.kind,
						commandId: item.command.commandId,
						error: e?.message ?? String(e),
					});

					if (isExplicitBusinessRejection(e)) {
						rollbackRejectedOutboxRecord({
							record,
							dispatch: api.dispatch,
							logger,
						});
					}

					api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));

					const stateAfterFail = api.getState();
					const attemptsSoFar = selectOutboxById(stateAfterFail)[id]?.attempts ?? 0;

					const nextAttemptAtMs = computeNextAttemptAtMs({
						attemptsSoFar,
						nowMs: Date.now(),
					});
					outboxTelemetry.retryScheduled(record, nextAttemptAtMs, String(e?.message ?? e));

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
