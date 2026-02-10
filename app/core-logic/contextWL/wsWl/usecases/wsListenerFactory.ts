// app/core-logic/contextWL/wsWl/usecases/wsListenerFactory.ts
import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

import {
	wsConnected,
	wsDisconnected,
	wsDisconnectRequested,
	wsEnsureConnectedRequested,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import {
	authSessionRefreshed,
	authSignedOut,
	authSignInSucceeded,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import type { WsInboundEvent } from "@/app/adapters/primary/socket/ws.type";
import { onLikeAddedAck, onLikeRemovedAck } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

import {
	onCommentCreatedAck,
	onCommentDeletedAck,
	onCommentUpdatedAck,
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

import { onTicketConfirmedAck, onTicketRejectedAck } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import { mapWsTicketCompletedAck } from "@/app/core-logic/contextWL/ticketWl/usecases/read/helper/ticketAckFromWs";

import type { WsEventsGatewayPort } from "@/app/core-logic/contextWL/wsWl/gateway/wsWl.gateway";
import { logger } from "@/app/core-logic/utils/logger";

export type SessionRef = { current?: AuthSession };

type WsListenerDeps = {
	gateways: DependenciesWl["gateways"];
	wsUrl: string; // SockJS: "http://.../ws"
	sessionRef?: SessionRef;
};

export const wsListenerFactory = (deps: WsListenerDeps) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	const getSecureStore = () => deps.gateways?.auth?.secureStore;
	const getWsGateway = (): WsEventsGatewayPort | undefined => deps.gateways?.ws as any;

	// memorize last token used for STOMP handshake
	let lastToken: string | undefined;

	const readSession = async (): Promise<AuthSession | undefined> => {
		if (deps.sessionRef?.current) return deps.sessionRef.current;

		const secureStore = getSecureStore();
		if (!secureStore) return undefined;

		try {
			return await secureStore.loadSession();
		} catch (e) {
			logger.warn("[WS] readSession: secureStore.loadSession failed", {
				error: String((e as any)?.message ?? e),
			});
			return undefined;
		}
	};

	const routeInbound = (evt: WsInboundEvent, dispatch: AppDispatchWl) => {
		switch (evt.type) {
			case "social.like.added_ack": {
				dispatch(
					onLikeAddedAck({
						commandId: (evt as any).commandId,
						targetId: (evt as any).targetId,
						server: {
							count: (evt as any).count,
							me: (evt as any).me,
							version: (evt as any).version,
							updatedAt: (evt as any).updatedAt as any,
						},
					}),
				);
				return;
			}

			case "social.like.removed_ack": {
				dispatch(
					onLikeRemovedAck({
						commandId: (evt as any).commandId,
						targetId: (evt as any).targetId,
						server: {
							count: (evt as any).count,
							me: (evt as any).me,
							version: (evt as any).version,
							updatedAt: (evt as any).updatedAt as any,
						},
					}),
				);
				return;
			}

			case "social.comment.created_ack": {
				dispatch(
					onCommentCreatedAck({
						commandId: (evt as any).commandId,
						commentId: (evt as any).commentId,
						targetId: (evt as any).targetId,
						server: {
							createdAt: (evt as any).updatedAt,
							version: (evt as any).version,
						},
					}),
				);
				return;
			}

			case "social.comment.updated_ack": {
				dispatch(
					onCommentUpdatedAck({
						commandId: (evt as any).commandId,
						commentId: (evt as any).commentId,
						targetId: (evt as any).targetId,
						server: {
							editedAt: (evt as any).updatedAt,
							version: (evt as any).version,
						},
					}),
				);
				return;
			}

			case "social.comment.deleted_ack": {
				dispatch(
					onCommentDeletedAck({
						commandId: (evt as any).commandId,
						commentId: (evt as any).commentId,
						targetId: (evt as any).targetId,
						server: {
							deletedAt: (evt as any).updatedAt,
							version: (evt as any).version,
						},
					}),
				);
				return;
			}

			case "ticket.verification.completed_ack": {
				const ack = mapWsTicketCompletedAck(evt);
				dispatch(ack.kind === "TicketConfirmedAck" ? onTicketConfirmedAck(ack) : onTicketRejectedAck(ack));
				return;
			}

			default:
				logger.warn("[WS] unknown inbound event type", { type: (evt as any)?.type, evt });
				return;
		}
	};

	const disconnect = async (reason: string) => {
		const ws = getWsGateway();
		try {
			await ws?.disconnect();
		} catch (e) {
			logger.warn("[WS] disconnect failed", { reason, error: String((e as any)?.message ?? e) });
		}

		// on notifie le reducer que "we decided to disconnect"
		// (le wsDisconnected "réel" viendra via onWebSocketClose; on tolère l'idempotence)
		logger.info("[WS] disconnect requested", { reason });
	};

	const ensureConnected = async (api: { dispatch: AppDispatchWl; getState: () => RootStateWl }) => {
		const ws = getWsGateway();
		if (!ws) return;

		const stateSnapshot = ws.getState?.() ?? (ws.isConnected?.() ? "CONNECTED" : "DISCONNECTED");
		if (stateSnapshot === "CONNECTED") {
			logger.debug("[WS] ensureConnected: already CONNECTED");
			return;
		}
		if (stateSnapshot === "CONNECTING") {
			logger.debug("[WS] ensureConnected: already CONNECTING");
			return;
		}

		const session = await readSession();
		const token = session?.tokens?.accessToken;

		if (!token) {
			logger.debug("[WS] ensureConnected: skipped (no token)");
			return;
		}

		// si token change, on force un clean disconnect avant de reconnect
		if (lastToken && token !== lastToken) {
			logger.info("[WS] ensureConnected: token changed => forceReconnect");
			await disconnect("token_changed_before_connect");
		}

		lastToken = token;

		logger.info("[WS] connect", {
			wsUrl: deps.wsUrl,
			wsState: ws.getState?.(),
		});

		ws.connect({
			wsUrl: deps.wsUrl,
			token,
			onConnected: () => {
				logger.info("[WS] connected");
				api.dispatch(wsConnected());
			},
			onDisconnected: (info) => {
				logger.info("[WS] disconnected", info);
				api.dispatch(wsDisconnected(info));
			},
			onError: (frame) => {
				logger.error("[WS] onError", {
					message: frame?.headers?.message,
				});
			},
			onEvent: (evt) => routeInbound(evt, api.dispatch),
		});
	};

	const forceReconnect = async (api: { dispatch: AppDispatchWl; getState: () => RootStateWl }, reason: string) => {
		await disconnect(reason);
		await ensureConnected(api);
	};

	// -----------------------------
	// intents runtime
	// -----------------------------
	listen({
		actionCreator: wsEnsureConnectedRequested,
		effect: async (_, api) => {
			await ensureConnected(api as any);
		},
	});

	listen({
		actionCreator: wsDisconnectRequested,
		effect: async (_, api) => {
			await disconnect("runtime_request");
			// on peut aussi dispatch wsDisconnected(undefined) si tu veux un état immédiat côté UI,
			// mais ce n'est pas obligatoire puisque onWebSocketClose va arriver.
		},
	});

	// -----------------------------
	// triggers auth
	// -----------------------------
	listen({
		actionCreator: authSignInSucceeded,
		effect: async (_, api) => {
			logger.info("[WS] authSignInSucceeded => ensureConnected");
			await ensureConnected(api as any);
		},
	});

	listen({
		actionCreator: authSessionRefreshed,
		effect: async (_, api) => {
			logger.info("[WS] authSessionRefreshed => forceReconnect");
			// nécessaire SockJS+STOMP: headers utilisés au handshake
			await forceReconnect(api as any, "session_refreshed");
		},
	});

	listen({
		actionCreator: authSignedOut,
		effect: async () => {
			logger.info("[WS] authSignedOut => disconnect");
			await disconnect("signed_out");
			lastToken = undefined;
		},
	});

	return mw.middleware;
};

