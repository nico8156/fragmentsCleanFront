// appWl/runtimeListenerFactory.ts
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

import {
    appBecameActive,
    appBecameBackground,
    appConnectivityChanged,
} from "../typeAction/appWl.action";

import {
    outboxProcessOnce,
    outboxSuspendRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";

import {
    wsEnsureConnectedRequested,
    wsDisconnectRequested,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

const isSignedIn = (state: RootStateWl) => state.aState?.status === "signedIn";

export const runtimeListenerFactory = () => {
    const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
    const listener = runtimeListener.startListening as TypedStartListening<
        RootStateWl,
        AppDispatchWl
    >;

    listener({
        actionCreator: appBecameActive,
        effect: async (_, api) => {
            const signedIn = isSignedIn(api.getState());

            console.log("[APP RUNTIME] appBecameActive", { signedIn });

            // WS : uniquement si signedIn (sinon pas de token -> inutile)
            if (signedIn) {
                api.dispatch(wsEnsureConnectedRequested());
            }

            // ✅ IMPORTANT: outbox/sync uniquement si authentifié
            if (!signedIn) {
                console.log("[APP RUNTIME] app active: skip outbox/sync (not signedIn)");
                return;
            }

            api.dispatch(outboxProcessOnce());
            api.dispatch(replayRequested());
            api.dispatch(syncDecideRequested());
        },
    });

    listener({
        actionCreator: appConnectivityChanged,
        effect: async (action, api) => {
            const signedIn = isSignedIn(api.getState());

            if (action.payload.online) {
                console.log("[APP RUNTIME] connectivity online", { signedIn });

                if (signedIn) {
                    api.dispatch(wsEnsureConnectedRequested());
                    api.dispatch(outboxProcessOnce());
                    api.dispatch(syncDecideRequested());
                } else {
                    console.log("[APP RUNTIME] online: skip ws/outbox/sync (not signedIn)");
                }
            } else {
                console.log("[APP RUNTIME] connectivity offline: disconnect ws");
                api.dispatch(wsDisconnectRequested());
                // (optionnel) tu pourrais aussi suspendre l’outbox ici si tu veux
            }
        },
    });

    listener({
        actionCreator: appBecameBackground,
        effect: async (_, api) => {
            console.log("[APP RUNTIME] appBecameBackground: suspend outbox + ws disconnect");

            api.dispatch(outboxSuspendRequested());
            api.dispatch(wsDisconnectRequested());
            // pas de syncDecideRequested, pas de replay, pas de outboxProcessOnce
        },
    });

    return runtimeListener.middleware;
};
