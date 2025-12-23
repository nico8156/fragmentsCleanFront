import { createAction } from "@reduxjs/toolkit";
import {WsDisconnectInfo} from "@/app/adapters/primary/socket/ws.gateway";


export const wsEnsureConnectedRequested = createAction("WS/ENSURE_CONNECTED_REQUESTED");
export const wsDisconnectRequested = createAction("WS/DISCONNECT_REQUESTED");

export const wsConnected = createAction("WS/CONNECTED");
export const wsDisconnected = createAction<WsDisconnectInfo | undefined>("WS/DISCONNECTED");
