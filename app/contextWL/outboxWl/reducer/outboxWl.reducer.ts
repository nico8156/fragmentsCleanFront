import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import {enqueueCommited, outboxProcessOnce} from "@/app/contextWL/commentWl/cc";
import {statusTypes} from "@/app/contextWL/outboxWl/outbox.type";
import {markFailed, markProcessing, markSucceeded, removeFromQueue} from "@/app/contextWL/outboxWl/processOutbox";

const initialState:AppStateWl["outbox"] = {
    byId: {},
    queue: [],
    byCommandId: {},
}

export const outboxWlReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(enqueueCommited, (state, action) => {
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
            })
            .addCase(markProcessing, (state, action) => {
                const r = state.byId[action.payload.id];
                if (!r || r.status === "processing") return;
                r.status = "processing";
                r.attempts += 1;
            })
            .addCase(markFailed, (state, action) => {
                const {id, error} = action.payload
                const r = state.byId[id];
                if (!r) return;
                r.status = "failed";
                r.lastError = error;
            })
            .addCase(markSucceeded, (state, action) => {
                const r = state.byId[action.payload.id];
                if (!r) return;
                r.status = "succeeded";
            })
            .addCase(removeFromQueue, (state, action) => {
                const {id} = action.payload;
                const rec = state.byId[id];
                if (!rec) return;
                // retire de la queue
                state.queue = state.queue.filter((x) => x !== id);
                // nettoie index commandId
                const cmdId = rec.item.command.commandId;
                delete state.byCommandId[cmdId];
                // option: garder l’historique ? ici on supprime
                delete state.byId[id];
            })
    })