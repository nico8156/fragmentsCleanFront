import { logger } from "@/app/core-logic/utils/logger";
import { createReducer } from "@reduxjs/toolkit";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import type {
	WsClientState,
	WsConnectParams,
	WsDisconnectInfo,
	WsEventsGatewayPort,
} from "@/app/core-logic/contextWL/wsWl/gateway/wsWl.gateway";

import { isWsInboundEvent } from "@/app/adapters/primary/socket/ws.type";
import {
	appBecameActive,
	appBecameBackground,
	appBecameInactive, appBootFailed, appBootRequested, appBootSucceeded,
	appConnectivityChanged, appHydrationDone, appWarmupDone, markHasCompletedOnboarding, markHasNotCompletedOnboarding
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import { AppRuntimeState, ISODate } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.type";

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

	/**
	 * ✅ Compat interface: certains ports demandent un flag "isActive"
	 * On l’expose comme une propriété calculée (getter) => conforme à "Property 'isActive'".
	 */
	get isActive(): boolean {
		// "active" au sens large: en train de connecter ou connecté
		return this.state === "CONNECTING" || this.state === "CONNECTED";
	}

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

const initialState: AppRuntimeState = {
	phase: "cold",
	online: true,
	hasCompletedOnboarding: false,
	boot: { doneHydration: false, doneWarmup: false },
};

export const appReducer = createReducer(
	initialState,
	(builder) => {
		builder
			.addCase(appWarmupDone, (s) => {
				s.boot.doneWarmup = true
			})
			.addCase(appHydrationDone, (s) => {
				s.boot.doneHydration = true
			})
			.addCase(appBecameActive, (s) => {
				s.phase = s.boot.doneHydration ? "ready" : "booting";
				s.lastActiveAt = new Date().toISOString() as ISODate;
			})
			.addCase(appBecameBackground, (s) => { s.phase = "background"; })
			.addCase(appBecameInactive, (s) => { s.phase = "inactive"; })
			.addCase(appConnectivityChanged, (s, { payload }) => {
				s.online = payload.online;
				if (payload.online) s.lastOnlineAt = new Date().toISOString() as ISODate;
			})
			.addCase(appBootRequested, (s) => { s.phase = "booting"; s.boot.error = null; })
			.addCase(appBootSucceeded, (s) => { s.phase = "ready"; s.boot.error = null; })
			.addCase(appBootFailed, (s, a) => { s.phase = "error"; s.boot.error = a.payload.message; })
			.addCase(markHasCompletedOnboarding, (s, _) => {
				s.hasCompletedOnboarding = true
			})
			.addCase(markHasNotCompletedOnboarding, (s, _) => {
				s.hasCompletedOnboarding = false
			})
	}
)
