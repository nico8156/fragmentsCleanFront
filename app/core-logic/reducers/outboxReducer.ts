import {createAction, createReducer} from "@reduxjs/toolkit";
import {AppState, UUID} from "@/app/store/appState";
import {OutboxItem} from "@/app/core-logic/gateways/outBoxGateway";
import {likeBumped, likeEnqueued, likeFailed, likeRemoved} from "@/app/contexts/like/write/like.listener";

const initialState : AppState["outboxQueue"]= [];

export const outboxReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(likeEnqueued, (state, action) => {
                const i = state.findIndex(c => c.type === "Like.Set" && c.targetId === action.payload.targetId);
                if (i !== -1) state.splice(i, 1);
                state.push({ ...action.payload, attempts: 0 });
            })
            .addCase(likeRemoved, (state, action) => {
                const i = state.findIndex(c => c.commandId === action.payload.commandId);
                if (i !== -1) state.splice(i, 1);
            })
            .addCase(likeBumped, (state, action) => {
                const c = state.find(x => x.commandId === action.payload.commandId);
                if (c) { c.attempts += 1; c.error = action.payload.error; }
            })
            .addCase(likeFailed,(state, action) => {
                const i = state.findIndex(c => c.commandId === action.payload.commandId);
                if (i !== -1) state.splice(i, 1);
            })
    }
)

export const selectOutbox = (s:AppState) => s.outboxQueue;
