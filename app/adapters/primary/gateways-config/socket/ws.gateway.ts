import {WsInboundEvent} from "@/app/adapters/primary/gateways-config/socket/ws.type";


export type WsConnectParams = {
    wsUrl: string;
    token: string;
    onConnected?: () => void;
    onDisconnected?: (reason?: { code?: number; message?: string }) => void;
    onEvent: (event: WsInboundEvent) => void;
    onError?: (error: unknown) => void;
};

export interface WsEventsGatewayPort {
    connect(params: WsConnectParams): void;
    disconnect(): void;
    isActive(): boolean;
}
