import { logger } from "@/app/core-logic/utils/logger";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { WsConnectParams, WsEventsGatewayPort } from "./ws.gateway";
import { isWsInboundEvent } from "./ws.type";


const safeJsonParse = (s: string): unknown => {
	try { return JSON.parse(s); } catch { return undefined; }
};

export class WsStompEventsGateway implements WsEventsGatewayPort {
	private client?: Client;
	private sub?: StompSubscription;

	connect(params: WsConnectParams): void {
		// ✅ si déjà connecté, on ne refait rien
		if (this.client?.connected) return;

		// ⚠️ si "active mais pas connected" (reconnect en cours), on ne recrée pas un 2e client
		if (this.client?.active && !this.client?.connected) return;

		const httpUrl = params.wsUrl
			.replace(/^ws:\/\//, "http://")
			.replace(/^wss:\/\//, "https://");

		logger.info("[WS] connect sockjs", { httpUrl });

		const socket = new SockJS(httpUrl);

		this.client = new Client({
			brokerURL: undefined,
			webSocketFactory: () => socket as any,

			connectHeaders: { Authorization: `Bearer ${params.token}` },
			reconnectDelay: 3000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,

			onConnect: () => {
				logger.info("[WS] CONNECTED -> subscribe /user/queue/acks");

				this.sub?.unsubscribe();
				this.sub = this.client!.subscribe("/user/queue/acks", (msg: IMessage) => {
					const raw = safeJsonParse(msg.body);

					if (!isWsInboundEvent(raw)) {
						console.warn("[WS] inbound invalid event", raw);
						return;
					}

					logger.info("[WS] inbound validated -> forwarding to onEvent", raw.type);
					params.onEvent(raw);
				});

				params.onConnected?.();
			},

			onStompError: (frame) => {
				logger.error("[WS] stomp error", frame.headers?.message, frame.body);
				params.onError?.(frame);
			},

			onWebSocketClose: (evt) => {
				logger.info("[WS] ws close", (evt as any)?.code, (evt as any)?.reason);
				params.onDisconnected?.({ code: (evt as any)?.code, message: (evt as any)?.reason });
			},
		});

		this.client.activate();
	}

	disconnect(): void {
		this.sub?.unsubscribe();
		this.sub = undefined;

		const c = this.client;
		this.client = undefined;

		c?.deactivate();
	}

	// ✅ isActive = "connected" (utile pour ensureConnected)
	isActive(): boolean {
		return !!this.client?.connected;
	}
}
