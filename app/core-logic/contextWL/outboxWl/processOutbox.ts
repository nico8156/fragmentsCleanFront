import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { TypedStartListening } from "@reduxjs/toolkit";
import { createListenerMiddleware, accountGeneration, accountIsReady } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";

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

const nextCheckAtIn30s = () => new Date(Date.now() + 30_000).toISOString();

const getNextAttemptAt = (rec: any): number | undefined => {
	const value = rec?.nextAttemptAt;
	if (typeof value === "number" && Number.isFinite(value)) return value;
	return undefined;
};

const isExplicitBusinessRejection = (e: unknown): boolean => {
	return isGatewayError(e)
		&& e.kind === "business"
		&& (e.code === "COMMAND_REJECTED" || e.code === "COMMAND_ID_CONFLICT");
};

export const processOutboxFactory = (deps: DependenciesWl, callback?: () => void) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	let inFlightGeneration: number | undefined;

	listen({
		actionCreator: outboxProcessOnce,
		effect: async (_action, api) => {
			const generation = accountGeneration(api.getState());
			if (inFlightGeneration === generation) {
				logger.debug("[OUTBOX] processOnce: skipped (already running)");
				return;
			}

			inFlightGeneration = generation;
			try {
				const state = api.getState();
				if (!accountIsReady(state)) return;

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
				if (generation !== accountGeneration(api.getState()) || !accountIsReady(api.getState())) return;
				if (!token) {
					logger.debug("[OUTBOX] processOnce: skipped (no token)");
					return;
				}

				const readyState = api.getState();
				const queue: OutboxStateWl["queue"] = selectOutboxQueue(readyState);
				if (!queue.length) {
					logger.debug("[OUTBOX] processOnce: skipped (queue empty)");
					return;
				}

				const byId: OutboxStateWl["byId"] = selectOutboxById(readyState);
				// Preserve intent order for an experience, including predecessors
				// awaiting canonical ACK or requeued after a transport failure.
				// Stable sorting retains persisted insertion order for equal timestamps.
				const firstByExperience = new Map<string, string>();
				for (const record of Object.values(byId).sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt))) {
					const command = record.item.command;
					if (command.kind.startsWith("Experience.") && "experienceId" in command
						&& !firstByExperience.has(command.experienceId)) firstByExperience.set(command.experienceId, record.id);
				}
				// Once creation is confirmed, deletion supersedes pending edits/media.
				// It must not wait forever for an upload whose local file is unavailable.
				for (const record of Object.values(byId)) {
					const command = record.item.command;
					if (command.kind !== "Experience.Delete") continue;
					const first = byId[firstByExperience.get(command.experienceId) ?? ""];
					if (first && first.item.command.kind !== "Experience.Create" && first.item.command.kind !== "Experience.Delete") {
						firstByExperience.set(command.experienceId, record.id);
					}
				}
				const nowMs = Date.now();

				const eligibleId = queue.find((qid) => {
					const rec = byId[qid];
					if (!rec) return false;
					if (rec.status !== statusTypes.queued) return false;
					const command = rec.item.command;
					if (command.kind.startsWith("Experience.") && "experienceId" in command
						&& firstByExperience.get(command.experienceId) !== qid) return false;

					const nextAttemptAt = getNextAttemptAt(rec as any);
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
					const iso = nextCheckAtIn30s();

					api.dispatch(markAwaitingAck({ id, nextCheckAt: iso }));
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
					if (isExplicitBusinessRejection(e)) {
						logger.warn("[OUTBOX] processOnce: business rejection, rolling back and dropping", {
							id,
							kind: item.command.kind,
							commandId: item.command.commandId,
							error: e?.message ?? String(e),
						});
						rollbackRejectedOutboxRecord({
							record,
							dispatch: api.dispatch,
							logger,
							gateways: deps.gateways,
							rejectionCode: e.reason,
						});
						api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));
						api.dispatch(dequeueCommitted({ id }));
						api.dispatch(dropCommitted({ commandId: item.command.commandId }));
						callback?.();
						return;
					}

					logger.error("[OUTBOX] processOnce: transient error", {
						id,
						kind: item.command.kind,
						commandId: item.command.commandId,
						error: e?.message ?? String(e),
					});

					api.dispatch(markFailed({ id, error: String(e?.message ?? e) }));

					const stateAfterFail = api.getState();
					const attemptsSoFar = selectOutboxById(stateAfterFail)[id]?.attempts ?? 0;

					const nextAttemptAt = computeNextAttemptAtMs({
						attemptsSoFar,
						nowMs: Date.now(),
					});
					outboxTelemetry.retryScheduled(record, nextAttemptAt, String(e?.message ?? e));

					api.dispatch(scheduleRetry({ id, nextAttemptAt }));
				}

				callback?.();
			} finally {
				if (inFlightGeneration === generation) inFlightGeneration = undefined;
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
