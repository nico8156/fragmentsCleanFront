import {createAction, createReducer} from "@reduxjs/toolkit";
import {AppState, UUID} from "@/app/store/appState";
import {OutboxItem} from "@/app/core-logic/gateways/outBoxGateway";

export const outboxEnqueued  = createAction<OutboxItem>("outbox/ENQUEUED")
export const outboxReplaced = createAction<OutboxItem[]>("outbox/REPLACED")
export const outboxRemoved = createAction<{commandId:UUID}>("outbox/REMOVED")
export const outboxBumped = createAction<{commandId:UUID; error?:string}>("outbox/BUMPED")
export const outboxFailed=createAction<{commandId:UUID; error:string}>("outbox/FAILED")

const initialState : AppState["outboxQueue"]= [];

export const outboxReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(outboxEnqueued, (state, action) => {
                state.push(action.payload)
            })
            .addCase(outboxReplaced, (_state, action) => {
                return action.payload;
            })
            .addCase(outboxRemoved, (state, action) => {
                state.filter(x => x.commandId !== action.payload.commandId)
            })
            .addCase(outboxBumped, (state, action) => {
                const item = state.find(x => x.commandId === action.payload.commandId);
                if (item) item.attempts += 1;
            })
            .addCase(outboxFailed, (state, action) => {
                const i = state.findIndex(x => x.commandId === action.payload.commandId);
                if (i !== -1) state.splice(i, 1);
            })
    }
)

export const selectOutbox = (s:AppState) => s.outboxQueue;