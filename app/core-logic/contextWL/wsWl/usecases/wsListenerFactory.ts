import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import {
    wsConnected, wsDisconnected, wsDisconnectRequested, wsEnsureConnectedRequested

} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import {
    authSessionRefreshed, authSignedOut,
    authSignInSucceeded

} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import { onLikeAddedAck, onLikeRemovedAck } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import type { WsInboundEvent } from "@/app/adapters/primary/socket/ws.type";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

import {
    onCommentCreatedAck, onCommentDeletedAck, onCommentUpdatedAck

} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

import { mapWsTicketCompletedAck } from "@/app/core-logic/contextWL/ticketWl/usecases/read/helper/ticketAckFromWs";
import { onTicketConfirmedAck, onTicketRejectedAck } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";

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
    const getWsGateway = () => deps.gateways?.ws;

    const readSession = async (): Promise<AuthSession | undefined> => {
        if (deps.sessionRef?.current) return deps.sessionRef.current;
        const secureStore = getSecureStore();
        if (!secureStore) return undefined;
        return await secureStore.loadSession();
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
                console.warn("[WS] unknown inbound event type", (evt as any)?.type, evt);
                return;
        }
    };

    const ensureConnected = async (api: { dispatch: AppDispatchWl }) => {
        const ws = getWsGateway();
        if (!ws) return;

        // ✅ évite reconnect si vraiment connecté
        if (ws.isActive()) return;

        const session = await readSession();
        const token = session?.tokens?.accessToken;
        if (!token) return;

        ws.connect({
            wsUrl: deps.wsUrl,
            token,
            onConnected: () => api.dispatch(wsConnected()),
            onDisconnected: () => api.dispatch(wsDisconnected()),
            onEvent: (evt) => routeInbound(evt, api.dispatch),
        });
    };

    const disconnect = (api: { dispatch: AppDispatchWl }) => {
        const ws = getWsGateway();
        ws?.disconnect();
        //api.dispatch(wsDisconnected()); ====> wsListenerFactory devient l’unique dispatcher via 1 dispatch (cf plus haut )
    };

    const forceReconnect = async (api: { dispatch: AppDispatchWl }) => {
        // ✅ force un handshake STOMP avec le nouveau token
        disconnect(api);
        await ensureConnected(api);
    };

    // intents runtime
    listen({
        actionCreator: wsEnsureConnectedRequested,
        effect: async (_, api) => {
            await ensureConnected(api);
        },
    });

    listen({
        actionCreator: wsDisconnectRequested,
        effect: async (_, api) => {
            disconnect(api);
        },
    });

    // triggers auth
    listen({
        actionCreator: authSignInSucceeded,
        effect: async (_, api) => {
            await ensureConnected(api);
        },
    });

    listen({
        actionCreator: authSessionRefreshed,
        effect: async (_, api) => {
            // ✅ on force reconnect pour garantir que le token de connexion STOMP est à jour
            await forceReconnect(api);
        },
    });

    listen({
        actionCreator: authSignedOut,
        effect: async (_, api) => {
            disconnect(api);
        },
    });

    return mw.middleware;
};
