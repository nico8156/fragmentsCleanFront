import { createAction } from "@reduxjs/toolkit";

export const wsEnsureConnectedRequested = createAction("WS/ENSURE_CONNECTED_REQUESTED");
export const wsDisconnectRequested = createAction("WS/DISCONNECT_REQUESTED");

export const wsConnected = createAction("WS/CONNECTED");
export const wsDisconnected = createAction("WS/DISCONNECTED");
