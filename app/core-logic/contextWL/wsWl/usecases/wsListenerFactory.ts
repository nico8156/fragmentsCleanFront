import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

import {
    authSignInSucceeded,
    authSessionRefreshed,
    authSignedOut,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import {
    wsEnsureConnectedRequested,
    wsDisconnectRequested,
    wsConnected,
    wsDisconnected,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";


import { onLikeAddedAck, onLikeRemovedAck } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import {
    CommentAckWire,
    LikeAckWire,
    TicketVerifyAckWire,
    WsInboundEvent
} from "@/app/adapters/primary/gateways-config/socket/ws.type";
// TODO: tes actions comments / tickets
// import { onCommentCreatedAck, onCommentUpdatedAck, onCommentDeletedAck } from "...";
// import { onTicketVerifyAcceptedAck, onTicketVerifyRejectedAck } from "...";

export type SessionRef = { current?: AuthSession };

type WsListenerDeps = {
    gateways: DependenciesWl["gateways"];
    wsUrl: string;
    sessionRef?: SessionRef;
};

export const wsListenerFactory = (deps: WsListenerDeps) => {
    const mw = createListenerMiddleware<AppStateWl, AppDispatchWl>();
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    const getSecureStore = () => deps.gateways?.auth?.secureStore;
    const getWsGateway = () => deps.gateways?.ws; // ✅ gateways.ws = WsEventsGatewayPort

    const readSession = async (): Promise<AuthSession | undefined> => {
        if (deps.sessionRef?.current) return deps.sessionRef.current;
        const secureStore = getSecureStore();
        if (!secureStore) return undefined;
        return await secureStore.loadSession();
    };

    const routeEvent = (event: WsInboundEvent, api: { dispatch: AppDispatchWl }) => {
        switch (event.type) {
            case "social.like.added_ack": {
                const e = event as LikeAckWire;
                api.dispatch(onLikeAddedAck({
                    commandId: e.commandId,
                    targetId: e.targetId,
                    server: { count: e.count, me: e.me, version: e.version, updatedAt: e.updatedAt },
                }));
                return;
            }
            case "social.like.removed_ack": {
                const e = event as LikeAckWire;
                api.dispatch(onLikeRemovedAck({
                    commandId: e.commandId,
                    targetId: e.targetId,
                    server: { count: e.count, me: e.me, version: e.version, updatedAt: e.updatedAt },
                }));
                return;
            }

            // --- comments (à brancher quand tu as les actions) ---
            case "social.comment.created_ack":
            case "social.comment.updated_ack":
            case "social.comment.deleted_ack": {
                const e = event as CommentAckWire;
                // api.dispatch(onCommentCreatedAck(...))
                return;
            }

            // --- tickets verify ---
            case "ticket.verify.accepted_ack":
            case "ticket.verify.rejected_ack": {
                const e = event as TicketVerifyAckWire;
                // api.dispatch(onTicketVerifyAcceptedAck(...))
                return;
            }

            default:
                return;
        }
    };

    const ensureConnected = async (api: { dispatch: AppDispatchWl }) => {
        const session = await readSession();
        const token = session?.tokens?.accessToken;
        if (!token) return;

        const ws = getWsGateway();
        if (!ws) return;

        ws.connect({
            wsUrl: deps.wsUrl,
            token,
            onConnected: () => api.dispatch(wsConnected()),
            onDisconnected: () => api.dispatch(wsDisconnected()),
            onEvent: (event) => routeEvent(event, api),
            onError: (err) => console.warn("[WS] stomp error", err),
        });
    };

    const disconnect = (api: { dispatch: AppDispatchWl }) => {
        getWsGateway()?.disconnect();
        api.dispatch(wsDisconnected());
    };

    // runtime intentions
    listen({ actionCreator: wsEnsureConnectedRequested, effect: async (_, api) => ensureConnected(api) });
    listen({ actionCreator: wsDisconnectRequested, effect: async (_, api) => disconnect(api) });

    // auth triggers
    listen({ actionCreator: authSignInSucceeded, effect: async (_, api) => ensureConnected(api) });
    listen({ actionCreator: authSessionRefreshed, effect: async (_, api) => ensureConnected(api) });
    listen({ actionCreator: authSignedOut, effect: async (_, api) => disconnect(api) });

    return mw.middleware;
};
