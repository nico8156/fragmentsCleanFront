import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {enqueueCommitted} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {statusTypes} from "@/app/contextWL/outboxWl/type/outbox.type";
import {
    dequeueCommitted, dropCommitted, markAwaitingAck,
    markFailed,
    markProcessing,
} from "@/app/contextWL/outboxWl/processOutbox";

const initialState:AppStateWl["outbox"] = {
    byId: {},
    queue: [],
    byCommandId: {},
}

export const outboxWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(enqueueCommitted, (state, action) => {
                const {id, item, enqueuedAt} = action.payload;
                const cmdId = item.command.commandId;
                // dédup idempotente
                if (state.byCommandId[cmdId]) return;
                state.byId[id] = {
                    id,
                    item,
                    status: statusTypes.queued,
                    attempts: 0,
                    enqueuedAt,
                };
                state.queue.push(id);
                state.byCommandId[cmdId] = id;
                return;
            })
            .addCase(markProcessing, (state, action) => {
                const r = state.byId[action.payload.id];
                if (!r || r.status === statusTypes.processing) return;
                r.status = statusTypes.processing;
                r.attempts += 1;
            })
            .addCase(markFailed, (state, action) => {
                const {id, error} = action.payload
                const r = state.byId[id];
                if (!r) return;
                r.status = statusTypes.failed;
                r.lastError = error;
            })
            .addCase(dequeueCommitted, (state, action) => {
                const {id} = action.payload;
                state.queue = state.queue.filter((x) => x !== id);
                })
            .addCase(markAwaitingAck, (state, action) => {
                const {id, ackBy} = action.payload;
                const rec = state.byId[id];
                if (!rec) return;
                rec.status = statusTypes.awaitingAck
                rec.nextCheckAt = ackBy;
                })
            .addCase(dropCommitted, (state, action) => {
                const {commandId} = action.payload;
                const r = state.byCommandId[commandId];
                if (!r) return;
                delete state.byId[r];
                delete state.byCommandId[commandId];
            })
    })