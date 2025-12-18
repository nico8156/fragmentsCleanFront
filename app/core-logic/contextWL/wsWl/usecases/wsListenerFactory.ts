import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import type { DependenciesWl } from "@/app/store/appStateWl";

import {
    wsEnsureConnectedRequested,
    wsDisconnectRequested, wsConnected, wsDisconnected,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import {
    authSignInSucceeded,
    authSessionRefreshed,
    authSignedOut,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import {
    onLikeAddedAck,
    onLikeRemovedAck,
} from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";

import type { WsInboundEvent } from "@/app/adapters/primary/gateways-config/socket/ws.type";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {
    onCommentCreatedAck,
    onCommentDeletedAck,
    onCommentUpdatedAck
} from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

export type SessionRef = { current?: AuthSession };

type WsListenerDeps = {
    gateways: DependenciesWl["gateways"];
    wsUrl: string; // en SockJS: "http://.../ws"
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
            // -------------------
            // Likes (flat)
            // -------------------
            case "social.like.added_ack": {
                // event réel: { type, commandId, targetId, count, me, version, updatedAt }
                console.log("[WS-RECEIVED-ROUTED] like.added_ack", {
                    commandId: (evt as any).commandId,
                    targetId: (evt as any).targetId,
                });

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
                console.log("[WS-RECEIVED-ROUTED] like.removed_ack", {
                    commandId: (evt as any).commandId,
                    targetId: (evt as any).targetId,
                });

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

            // -------------------
            // Comments (flat)
            // -------------------
            case "social.comment.created_ack": {
                console.log("[WS-RECEIVED-ROUTED] comment.created_ack", {
                    commandId: (evt as any).commandId,
                    commentId: (evt as any).commentId,
                    targetId: (evt as any).targetId,
                });

                dispatch(
                    onCommentCreatedAck({
                        commandId: (evt as any).commandId,
                        commentId: (evt as any).commentId,
                        targetId: (evt as any).targetId,
                        server: {
                            createdAt: (evt as any).updatedAt, // ✅ mapping
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

            default:
                console.warn("[WS] unknown inbound event type", (evt as any)?.type, evt);
                return;
        }
    };

    const ensureConnected = async (api: { dispatch: AppDispatchWl }) => {
        const ws = getWsGateway();
        if (!ws) return;

        // évite les reconnects inutiles
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
        api.dispatch(wsDisconnected());
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
            // si déjà connecté, on laisse vivre (ou tu peux forcer reconnect si tu veux)
            await ensureConnected(api);
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
