import type { AppStateWl } from "@/app/store/appStateWl";
import { createReducer } from "@reduxjs/toolkit";

import {
	dequeueCommitted,
	dropCommitted,
	enqueueCommitted,
	markAwaitingAck,
	markFailed,
	markProcessing,
	outboxRehydrateCommitted,
	outboxResumeRequested,
	outboxSuspendRequested,
	scheduleRetry,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export const initialOutboxState: AppStateWl["oState"] = {
	byId: {},
	queue: [],
	byCommandId: {},
	suspended: false,
};

const removeFromQueue = (state: AppStateWl["oState"], id: string) => {
	if (!state.queue.length) return;
	state.queue = state.queue.filter((x) => x !== id);
};

export const outboxWlReducer = createReducer(initialOutboxState, (builder) => {
	builder
		.addCase(outboxSuspendRequested, (state) => {
			state.suspended = true;
		})
		.addCase(outboxResumeRequested, (state) => {
			state.suspended = false;
		})

		.addCase(enqueueCommitted, (state, action) => {
			const { id, item, enqueuedAt } = action.payload;
			const cmdId = item.command.commandId;

			// idempotence par commandId
			if (state.byCommandId[cmdId]) return;

			state.byId[id] = {
				id,
				item,
				status: statusTypes.queued,
				attempts: 0,
				enqueuedAt,
			};

			// queue contient uniquement les IDs "candidats" (queued)
			state.queue.push(id);
			state.byCommandId[cmdId] = id;
		})

		.addCase(markProcessing, (state, action) => {
			const r = state.byId[action.payload.id];
			if (!r) return;

			// processing = pas dans queue
			removeFromQueue(state, r.id);

			if (r.status !== statusTypes.processing) {
				r.status = statusTypes.processing;
				r.attempts += 1;
			}

			// clear retry schedule
			if ("nextAttemptAt" in r) delete (r as any).nextAttemptAt;
		})

		.addCase(markFailed, (state, action) => {
			const { id, error } = action.payload;
			const r = state.byId[id];
			if (!r) return;

			// failed = pas dans queue
			removeFromQueue(state, id);

			r.status = statusTypes.failed;
			r.lastError = error;
		})


		.addCase(dequeueCommitted, (state, action) => {
			removeFromQueue(state, action.payload.id);
		})

		.addCase(scheduleRetry, (state, action) => {
			const { id } = action.payload as any;
			const r = state.byId[id];
			if (!r) return;

			// ✅ compat: ancien nextAttemptAt / nouveau nextAttemptAtMs
			const nextAttemptAt: number | undefined =
				(action.payload as any).nextAttemptAt ??
				(action.payload as any).nextAttemptAtMs;

			if (typeof nextAttemptAt !== "number") return;

			r.status = statusTypes.queued;
			r.nextAttemptAt = nextAttemptAt;

			// queue = doit être dans queue
			if (!state.queue.includes(id)) {
				state.queue.push(id);
			}
		})

		.addCase(markAwaitingAck, (state, action) => {
			const { id } = action.payload as any;
			const rec = state.byId[id];
			if (!rec) return;

			// ✅ compat: ancien ackBy / nouveau ackByIso
			const nextCheckAt: string | undefined =
				(action.payload as any).ackBy ??
				(action.payload as any).ackByIso;

			removeFromQueue(state, id);

			rec.status = statusTypes.awaitingAck;
			rec.nextCheckAt = nextCheckAt;
		})

		.addCase(dropCommitted, (state, action) => {
			const { commandId } = action.payload;
			const id = state.byCommandId[commandId];
			if (!id) return;

			removeFromQueue(state, id);

			delete state.byId[id];
			delete state.byCommandId[commandId];
		})

		.addCase(outboxRehydrateCommitted, (_state, action) => {
			const snap = action.payload;

			const byId = snap?.byId ?? {};
			const byCommandId = snap?.byCommandId ?? {};

			// queue filtrée : queued uniquement + ids existants
			const queueRaw = Array.isArray(snap?.queue) ? snap.queue : [];
			const queue = queueRaw.filter(
				(id: string) => !!byId?.[id] && byId[id].status === statusTypes.queued,
			);

			// nettoie byCommandId
			const cleanByCommandId: Record<string, string> = {};
			for (const [cmdId, id] of Object.entries(byCommandId)) {
				if ((byId as any)[id]) cleanByCommandId[cmdId] = id;
			}

			return {
				byId,
				queue,
				byCommandId: cleanByCommandId,
				suspended: snap?.suspended ?? false,
			};
		});
});
