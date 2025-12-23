// app/adapters/primary/gateways-config/socket/ws.gateway.ts
import type { WsInboundEvent } from "./ws.type";

export type WsDisconnectInfo = { code?: number; message?: string };

export type WsConnectParams = {
    wsUrl: string;
    token: string;
    onConnected?: () => void;
    onDisconnected?: (info?: WsDisconnectInfo) => void;
    onError?: (frame: any) => void;
    onEvent: (event: WsInboundEvent) => void; // ✅ typé !
};

export interface WsEventsGatewayPort {
    connect(params: WsConnectParams): void;
    disconnect(): void;
    isActive(): boolean;
}
