// app/core-logic/contextWL/wsWl/port/wsEventsGateway.port.ts
import type { WsInboundEvent } from "@/app/adapters/primary/socket/ws.type"; // si tu veux, on peut aussi déplacer WsInboundEvent dans le context

export type WsDisconnectInfo = { code?: number; message?: string };

export type WsConnectParams = {
	wsUrl: string; // SockJS: "http://.../ws"
	token: string;
	onConnected?: () => void;
	onDisconnected?: (info?: WsDisconnectInfo) => void;
	onError?: (frame: any) => void;
	onEvent: (event: WsInboundEvent) => void;
};

export type WsClientState = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export interface WsEventsGatewayPort {
	connect(params: WsConnectParams): void;
	disconnect(): Promise<void>;
	isConnected(): boolean;
	getState(): WsClientState;
}

