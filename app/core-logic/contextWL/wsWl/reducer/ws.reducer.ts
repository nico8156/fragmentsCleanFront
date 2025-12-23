import { createReducer } from "@reduxjs/toolkit";
import type { WsStateWl } from "@/app/core-logic/contextWL/wsWl/typeAction/ws.type";
import { wsConnected, wsDisconnected } from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

const initialState: WsStateWl = {
    connected: false,
};

export const wsReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(wsConnected, (s) => {
            if (s.connected) return; // ✅ idempotent
            s.connected = true;
            s.lastConnectedAt = new Date().toISOString();
        })
        .addCase(wsDisconnected, (s, a) => {
            if (!s.connected && !a.payload) return; // ✅ idempotent-ish
            s.connected = false;
            s.lastDisconnectedAt = new Date().toISOString();
            if (a.payload) s.lastDisconnectInfo = a.payload;
        });
});
