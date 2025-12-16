import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import type { WsConnectParams, WsEventsGatewayPort } from "./ws.gateway";
import { isWsInboundEvent } from "./ws.type";

const safeJsonParse = (s: string): unknown => {
    try { return JSON.parse(s); } catch { return undefined; }
};

export class WsStompEventsGateway implements WsEventsGatewayPort {
    private client?: Client;
    private sub?: StompSubscription;

    connect(params: WsConnectParams): void {
        if (this.client?.active || this.client?.connected) return;

        // ✅ SockJS veut une URL HTTP (pas ws://)
        const httpUrl = params.wsUrl
            .replace(/^ws:\/\//, "http://")
            .replace(/^wss:\/\//, "https://");

        console.log("[WS] connect sockjs", { httpUrl });

        const socket = new SockJS(httpUrl);

        this.client = new Client({
            brokerURL: undefined,
            webSocketFactory: () => socket as any,

            connectHeaders: { Authorization: `Bearer ${params.token}` },
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,

            onConnect: () => {
                console.log("[WS] CONNECTED -> subscribe /user/queue/acks");

                this.sub?.unsubscribe();
                this.sub = this.client!.subscribe("/user/queue/acks", (msg: IMessage) => {
                    const raw = safeJsonParse(msg.body);
                    console.log("[WS] inbound raw", raw);
                    console.log("[WS] inbound validated -> forwarding to onEvent", raw.type);

                    if (!isWsInboundEvent(raw)) return;
                    params.onEvent(raw);
                });

                params.onConnected?.();
            },

            onStompError: (frame) => {
                console.warn("[WS] stomp error", frame.headers?.message, frame.body);
                params.onError?.(frame);
            },

            onWebSocketClose: (evt) => {
                console.log("[WS] ws close", (evt as any)?.code, (evt as any)?.reason);
                params.onDisconnected?.({ code: (evt as any)?.code, message: (evt as any)?.reason });
            },
        });

        this.client.activate();
    }

    disconnect(): void {
        this.sub?.unsubscribe();
        this.sub = undefined;
        this.client?.deactivate();
        this.client = undefined;
    }

    isActive(): boolean {
        return !!this.client?.active;
    }
}
