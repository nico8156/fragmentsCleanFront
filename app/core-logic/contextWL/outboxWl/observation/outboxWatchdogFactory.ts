import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import { selectOutboxById } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";
import { commandKinds, statusTypes, type OutboxRecord } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

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

import { appBecameActive, appConnectivityChanged } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import { likeRollback } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import type { LikeUndo } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import { createRollback, deleteRollback, updateRollback } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.rollback.actions";
import { ticketRollBack } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";

import { logger } from "@/app/core-logic/utils/logger";

const isSignedIn = (s: RootStateWl) => s.aState?.status === "signedIn";

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

const isCommentCreateUndo = (
	u: unknown,
): u is { tempId: string; targetId: string; parentId?: string } => {
	const x = u as any;
	return !!x && typeof x.tempId === "string" && typeof x.targetId === "string";
};

export const outboxWatchdogFactory = (deps: WatchdogDeps) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	let timer: ReturnType<typeof setInterval> | null = null;
	let inFlight = false;

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

	const pickExpiredAwaitingAck = (byId: Record<string, OutboxRecord>, now: number) =>
		Object.values(byId).find((rec) => {
			if (rec.status !== statusTypes.awaitingAck) return false;
			const due = parseIsoMs(rec.nextCheckAt);
			if (!due) return false;
			return due <= now;
		});

	const rollbackForRejected = (rec: OutboxRecord, dispatch: AppDispatchWl) => {
		const item = rec.item as any;
		const cmd = item?.command;
		const undo = item?.undo;

		if (!cmd?.kind) return;

		switch (cmd.kind) {
			case commandKinds.LikeAdd:
			case commandKinds.LikeRemove: {
				const u = undo as LikeUndo;
				if (!u) return;
				dispatch(likeRollback({
					targetId: u.targetId,
					prevCount: u.prevCount,
					prevMe: u.prevMe,
					prevVersion: u.prevVersion,
				}));
				return;
			}

			case commandKinds.CommentCreate: {
				if (isCommentCreateUndo(undo)) {
					dispatch(createRollback({ tempId: undo.tempId, targetId: undo.targetId, parentId: undo.parentId }));
				}
				return;
			}

			case commandKinds.CommentUpdate: {
				const u = undo as { commentId: string; prevBody: string; prevVersion?: number };
				if (!u?.commentId) return;
				dispatch(updateRollback({ commentId: u.commentId, prevBody: u.prevBody, prevVersion: u.prevVersion }));
				return;
			}

			case commandKinds.CommentDelete: {
				const u = undo as { commentId: string; prevBody: string; prevVersion?: number; prevDeletedAt?: string };
				if (!u?.commentId) return;
				dispatch(deleteRollback({
					commentId: u.commentId,
					prevBody: u.prevBody,
					prevVersion: u.prevVersion,
					prevDeletedAt: u.prevDeletedAt,
				}));
				return;
			}

			case commandKinds.TicketVerify: {
				const u = undo as { ticketId: string };
				if (!u?.ticketId) return;
				dispatch(ticketRollBack({ ticketId: u.ticketId }));
				return;
			}

			default:
				return;
		}
	};

	const runOnce = async (api: { getState: () => RootStateWl; dispatch: AppDispatchWl }) => {
		if (inFlight) return;
		inFlight = true;

		try {
			const state = api.getState();
			if (!isSignedIn(state)) return;
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

			const rec = pickExpiredAwaitingAck(byId, now);
			if (!rec) return;

			const commandId = getCommandIdFromRecord(rec);
			if (!commandId) {
				api.dispatch(markFailed({ id: rec.id, error: "missing commandId for awaitingAck record" }));
				return;
			}

			logger.info("[OUTBOX_WD] checking status", { id: rec.id, commandId });

			const verdict = await commandStatus.getStatus(commandId);

			if (verdict.status === "APPLIED") {
				logger.info("[OUTBOX_WD] applied => drop + kick", { commandId, appliedAt: verdict.appliedAt });
				api.dispatch(dropCommitted({ commandId }));
				api.dispatch(outboxProcessOnce());
				return;
			}

			if (verdict.status === "REJECTED") {
				const reason = verdict.reason ?? "rejected";
				logger.warn("[OUTBOX_WD] rejected => rollback + fail + drop", { commandId, reason, rejectedAt: verdict.rejectedAt });

				rollbackForRejected(rec, api.dispatch);

				api.dispatch(markFailed({ id: rec.id, error: reason }));
				api.dispatch(dropCommitted({ commandId }));
				return;
			}

			// PENDING => replanifie prochain check
			const next = new Date(Date.now() + 5_000).toISOString();
			api.dispatch(markAwaitingAck({ id: rec.id, ackByIso: next }));
		} catch (e: any) {
			logger.error("[OUTBOX_WD] runOnce error", { error: String(e?.message ?? e) });
		} finally {
			inFlight = false;
		}
	};

	// triggers
	listen({
		actionCreator: appBecameActive,
		effect: async (_, api) => {
			startTimer(api.dispatch);
			await runOnce(api);
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
