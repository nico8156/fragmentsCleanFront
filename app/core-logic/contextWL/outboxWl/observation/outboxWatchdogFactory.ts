import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { TypedStartListening } from "@reduxjs/toolkit";
import { createListenerMiddleware, accountGeneration, accountIsReady, accountStorageReady } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";

import { selectBootReady, selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import { selectOutboxById } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { statusTypes, type OutboxRecord } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import {
	dropCommitted,
	markAwaitingAck,
	markFailed,
	outboxProcessOnce,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import {
	outboxAwaitingAckAdded,
	outboxWatchdogTick,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";

import {
	appBecameActive,
	appBecameBackground,
	appBecameForeground,
	appBecameInactive,
	appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import {
	reconcileAppliedOutboxRecord,
	rollbackRejectedOutboxRecord,
} from "@/app/core-logic/contextWL/outboxWl/commandHandlers/outboxCommandHandlers";
import { outboxTelemetry } from "@/app/core-logic/contextWL/outboxWl/observation/outboxObservability";

import { logger } from "@/app/core-logic/utils/logger";

const hasSession = (s: RootStateWl) => Boolean(s.aState?.session?.userId);
const getAuthedUserId = (s: RootStateWl): string | undefined =>
	s.aState?.session?.userId ?? (s.aState as any)?.currentUser?.id ?? undefined;
const MAX_ACK_CHECKS_PER_TICK = 5;

const parseIsoMs = (iso?: string) => {
	if (!iso) return undefined;
	const ms = Date.parse(iso);
	return Number.isFinite(ms) ? ms : undefined;
};

type WatchdogDeps = {
	gateways: DependenciesWl["gateways"];
	tickMs?: number;
	enableTimer?: boolean;
};

const getCommandIdFromRecord = (rec: OutboxRecord): string | undefined =>
	(rec.item as any)?.command?.commandId;

export const outboxWatchdogFactory = (deps: WatchdogDeps) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	let timer: ReturnType<typeof setInterval> | null = null;
	let inFlightGeneration: number | undefined;

	const startTimer = (dispatch: AppDispatchWl) => {
		if (!deps.enableTimer) return;
		if (timer) return;
		const every = deps.tickMs ?? 20_000;
		timer = setInterval(() => dispatch(outboxWatchdogTick()), every);
	};

	const stopTimer = () => {
		if (!timer) return;
		clearInterval(timer);
		timer = null;
	};

	const pickExpiredAwaitingAcks = (byId: Record<string, OutboxRecord>, now: number) =>
		Object.values(byId).filter((rec) => {
			if (rec.status !== statusTypes.awaitingAck) return false;
			const due = parseIsoMs(rec.nextCheckAt);
			if (!due) return false;
			return due <= now;
		}).sort((a, b) => {
			const aDue = parseIsoMs(a.nextCheckAt) ?? Number.MAX_SAFE_INTEGER;
			const bDue = parseIsoMs(b.nextCheckAt) ?? Number.MAX_SAFE_INTEGER;
			return aDue - bDue;
		}).slice(0, MAX_ACK_CHECKS_PER_TICK);

	const checkRecord = async (
		rec: OutboxRecord,
		api: { dispatch: AppDispatchWl; getState: () => RootStateWl },
		commandStatus: NonNullable<DependenciesWl["gateways"]["commandStatus"]>,
	) => {
		const commandId = getCommandIdFromRecord(rec);
		if (!commandId) {
			api.dispatch(markFailed({ id: rec.id, error: "missing commandId for awaitingAck record" }));
			return;
		}

		logger.info("[OUTBOX_WD] checking status", { id: rec.id, commandId });
		const generation = accountGeneration(api.getState());
		outboxTelemetry.ackCheck(rec);

		const verdict = await commandStatus.getStatus(commandId);
		if (generation !== accountGeneration(api.getState())) return;

		if (verdict.status === "APPLIED") {
			const applied = rec.item.command;
			if (applied.kind === "Experience.Delete") {
				// The successful terminal intent makes earlier edits/uploads obsolete.
				// Do not roll them back: their undo snapshots would resurrect the item.
				for (const pending of Object.values(selectOutboxById(api.getState()))) {
					const command = pending.item.command;
					if ("experienceId" in command && command.experienceId === applied.experienceId
						&& command.kind !== "Experience.Report" && command.kind !== "Experience.Create"
						&& command.commandId !== applied.commandId) {
						api.dispatch(dropCommitted({ commandId: command.commandId }));
					}
				}
			}
			logger.info("[OUTBOX_WD] applied => drop + kick", { commandId, appliedAt: verdict.appliedAt });
			outboxTelemetry.ackVerdict(rec, "APPLIED", { appliedAt: verdict.appliedAt });
			reconcileAppliedOutboxRecord({
				record: rec,
				dispatch: api.dispatch,
				gateways: deps.gateways,
				userId: getAuthedUserId(api.getState()),
			});
			api.dispatch(dropCommitted({ commandId }));
			api.dispatch(outboxProcessOnce());
			return;
		}

		if (verdict.status === "REJECTED") {
			const reason = verdict.reason ?? "rejected";
			logger.warn("[OUTBOX_WD] rejected => rollback + fail + drop", { commandId, reason, rejectedAt: verdict.rejectedAt });
			outboxTelemetry.ackVerdict(rec, "REJECTED", { reason, rejectedAt: verdict.rejectedAt });

			rollbackRejectedOutboxRecord({
				record: rec,
				dispatch: api.dispatch,
				logger,
				markLikeSyncFailed: true,
				rejectionCode: verdict.rejectionCode,
				gateways: deps.gateways,
			});

			api.dispatch(markFailed({ id: rec.id, error: reason }));
			api.dispatch(dropCommitted({ commandId }));
			return;
		}

		const next = new Date(Date.now() + 5_000).toISOString();
		outboxTelemetry.ackVerdict(rec, "PENDING", { nextCheckAt: next });
		api.dispatch(markAwaitingAck({ id: rec.id, nextCheckAt: next }));
	};

	const runOnce = async (api: { getState: () => RootStateWl; dispatch: AppDispatchWl }) => {
		const generation = accountGeneration(api.getState());
		if (inFlightGeneration === generation) return;
		inFlightGeneration = generation;
		try {
			const state = api.getState();
			if (!accountIsReady(state)) return;
			if (!selectBootReady(state)) return;
			if (!hasSession(state)) return;
			if (!selectIsOnline(state)) return;

			if (state.oState?.suspended) {
				logger.debug("[OUTBOX_WD] suspended => skip");
				return;
			}

			const commandStatus = deps.gateways?.commandStatus;
			if (!commandStatus) {
				logger.warn("[OUTBOX_WD] missing gateways.commandStatus");
				return;
			}

			const byId = selectOutboxById(state) as Record<string, OutboxRecord>;
			const now = Date.now();
			// Retry deadlines need a runtime trigger even when no ACK is pending.
			if (Object.values(byId).some(rec => rec.status === statusTypes.queued
				&& (!rec.nextAttemptAt || rec.nextAttemptAt <= now))) {
				api.dispatch(outboxProcessOnce());
			}

			const records = pickExpiredAwaitingAcks(byId, now);
			if (!records.length) return;

			for (const rec of records) {
				if (generation !== accountGeneration(api.getState())) return;
				const current = (selectOutboxById(api.getState()) as Record<string, OutboxRecord>)[rec.id];
				if (!current || current.status !== statusTypes.awaitingAck) continue;
				await checkRecord(current, api, commandStatus);
			}
		} catch (e: any) {
			logger.error("[OUTBOX_WD] runOnce error", { error: String(e?.message ?? e) });
		} finally {
			if (inFlightGeneration === generation) inFlightGeneration = undefined;
		}
	};

	// triggers
	listen({
		actionCreator: accountStorageReady,
		effect: async (_, api) => {
			stopTimer();
			if (hasSession(api.getState())) { startTimer(api.dispatch); await runOnce(api); }
		},
	});
	listen({
		actionCreator: appBecameActive,
		effect: async (_, api) => {
			stopTimer();
			startTimer(api.dispatch);
			await runOnce(api);
		},
	});

	listen({
		actionCreator: appBecameForeground,
		effect: async (_, api) => {
			stopTimer();
			startTimer(api.dispatch);
			await runOnce(api);
		},
	});

	listen({
		actionCreator: appBecameBackground,
		effect: async () => {
			logger.debug("[OUTBOX_WD] app background observed; keep watchdog timer registered");
		},
	});

	listen({
		actionCreator: appBecameInactive,
		effect: async () => {
			logger.debug("[OUTBOX_WD] app inactive observed; keep watchdog timer registered");
		},
	});

	listen({
		actionCreator: appConnectivityChanged,
		effect: async (action, api) => {
			if (action.payload.online) {
				startTimer(api.dispatch);
				await runOnce(api);
			} else {
				stopTimer();
			}
		},
	});

	listen({
		actionCreator: outboxAwaitingAckAdded,
		effect: async (_, api) => {
			await runOnce(api);
		},
	});

	listen({
		actionCreator: outboxWatchdogTick,
		effect: async (_, api) => {
			await runOnce(api);
		},
	});

	return mw.middleware;
};
