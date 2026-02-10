// app/adapters/primary/gateways-config/socket/ws.gateway.ts
import { logger } from "@/app/core-logic/utils/logger";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import type {
	WsClientState,
	WsConnectParams,
	WsDisconnectInfo,
	WsEventsGatewayPort,
} from "@/app/core-logic/contextWL/wsWl/gateway/wsWl.gateway";

import { isWsInboundEvent } from "./ws.type";

const safeJsonParse = (s: string): unknown => {
	try {
		return JSON.parse(s);
	} catch {
		return undefined;
	}
};

export class WsStompEventsGateway implements WsEventsGatewayPort {
	private client?: Client;
	private sub?: StompSubscription;

	// état interne (plus fiable que "active")
	private state: WsClientState = "DISCONNECTED";
	private connectSeq = 0;

	getState(): WsClientState {
		return this.state;
	}

	isConnected(): boolean {
		return this.state === "CONNECTED";
	}

	connect(params: WsConnectParams): void {
		// idempotent : si déjà connecté, rien à faire
		if (this.state === "CONNECTED") return;

		// si déjà en cours de connexion, on évite de spammer
		if (this.state === "CONNECTING") {
			logger.debug("[WS] connect skipped (already CONNECTING)");
			return;
		}

		const mySeq = ++this.connectSeq;
		this.state = "CONNECTING";

		const httpUrl = params.wsUrl
			.replace(/^ws:\/\//, "http://")
			.replace(/^wss:\/\//, "https://");

		logger.info("[WS] connect sockjs", { httpUrl, seq: mySeq });

		const socket = new SockJS(httpUrl);

		const client = new Client({
			brokerURL: undefined,
			webSocketFactory: () => socket as any,

			connectHeaders: { Authorization: `Bearer ${params.token}` },

			// ⚠️ on peut laisser reconnectDelay, mais la stratégie "app foreground" gère déjà
			// si tu le laisses, pas grave, mais garde l'état côté app.
			reconnectDelay: 3000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,

			onConnect: () => {
				// si un connect plus récent a été lancé, ignore
				if (mySeq !== this.connectSeq) return;

				this.state = "CONNECTED";
				logger.info("[WS] CONNECTED -> subscribe /user/queue/acks", { seq: mySeq });

				this.sub?.unsubscribe();
				this.sub = client.subscribe("/user/queue/acks", (msg: IMessage) => {
					const raw = safeJsonParse(msg.body);

					if (!isWsInboundEvent(raw)) {
						logger.warn("[WS] inbound invalid event", { raw });
						return;
					}

					logger.debug("[WS] inbound validated", { type: raw.type });
					params.onEvent(raw);
				});

				params.onConnected?.();
			},

			onStompError: (frame) => {
				if (mySeq !== this.connectSeq) return;

				// le serveur peut renvoyer une frame d'erreur (auth, etc.)
				logger.error("[WS] stomp error", {
					message: frame.headers?.message,
					body: frame.body,
					seq: mySeq,
				});

				params.onError?.(frame);
			},

			onWebSocketClose: (evt) => {
				if (mySeq !== this.connectSeq) return;

				const info: WsDisconnectInfo = {
					code: (evt as any)?.code,
					message: (evt as any)?.reason,
				};

				// close => on repasse DISCONNECTED
				this.state = "DISCONNECTED";

				logger.info("[WS] ws close", { ...info, seq: mySeq });
				params.onDisconnected?.(info);
			},
		});

		// remplace l'ancien client
		this.client = client;

		client.activate();
	}

	async disconnect(): Promise<void> {
		// incrémente la séquence : invalide callbacks d'un connect en cours
		this.connectSeq++;

		this.sub?.unsubscribe();
		this.sub = undefined;

		const c = this.client;
		this.client = undefined;

		// si on était en CONNECTING ou CONNECTED, on repasse DISCONNECTED
		this.state = "DISCONNECTED";

		if (!c) return;

		try {
			await c.deactivate();
		} catch (e) {
			logger.warn("[WS] deactivate failed", { error: String((e as any)?.message ?? e) });
		}
	}
}
