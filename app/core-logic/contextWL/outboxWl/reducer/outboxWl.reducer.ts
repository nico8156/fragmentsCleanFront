import { createReducer } from "@reduxjs/toolkit";
import { AppStateWl } from "@/app/store/appStateWl";

import { statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {
    dequeueCommitted,
    dropCommitted, enqueueCommitted,
    markAwaitingAck,
    markFailed,
    markProcessing,
    outboxRehydrateCommitted,
    scheduleRetry,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

export const initialOutboxState: AppStateWl["oState"] = {
    byId: {},
    queue: [],
    byCommandId: {},
};

const removeFromQueue = (state: AppStateWl["oState"], id: string) => {
    if (!state.queue.length) return;
    state.queue = state.queue.filter((x) => x !== id);
};

export const outboxWlReducer = createReducer(initialOutboxState, (builder) => {
    builder
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

            // queue = uniquement queued
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

        .addCase(scheduleRetry, (state, action) => {
            const { id, nextAttemptAt } = action.payload;
            const r = state.byId[id];
            if (!r) return;

            // queued = doit être dans queue
            r.status = statusTypes.queued;
            (r as any).nextAttemptAt = nextAttemptAt;

            if (!state.queue.includes(id)) {
                state.queue.push(id);
            }
        })

        .addCase(dequeueCommitted, (state, action) => {
            const { id } = action.payload;
            // dequeue = “plus candidat à l’envoi immédiat”
            removeFromQueue(state, id);
        })

        .addCase(markAwaitingAck, (state, action) => {
            const { id, ackBy } = action.payload;
            const rec = state.byId[id];
            if (!rec) return;

            // awaitingAck = jamais dans queue
            removeFromQueue(state, id);

            rec.status = statusTypes.awaitingAck;
            rec.nextCheckAt = ackBy;
        })

        .addCase(dropCommitted, (state, action) => {
            const { commandId } = action.payload;
            const id = state.byCommandId[commandId];
            if (!id) return;

            // purge partout
            removeFromQueue(state, id);

            delete state.byId[id];
            delete state.byCommandId[commandId];
        })

        .addCase(outboxRehydrateCommitted, (_state, action) => {
            const snap = action.payload;

            const byId = snap?.byId ?? {};
            const byCommandId = snap?.byCommandId ?? {};

            // queue filtrée:
            const queueRaw = Array.isArray(snap?.queue) ? snap!.queue : [];
            const queue = queueRaw.filter((id: string) => !!byId?.[id] && byId[id].status === statusTypes.queued);

            // optionnel: si byCommandId pointe vers un id manquant, on le drop
            const cleanByCommandId: Record<string, string> = {};
            for (const [cmdId, id] of Object.entries(byCommandId)) {
                if (byId[id]) cleanByCommandId[cmdId] = id;
            }

            return { byId, queue, byCommandId: cleanByCommandId };
        });
});
