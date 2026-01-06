// app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory.ts
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

import {
    appBecameActive, appBecameBackground, appConnectivityChanged

} from "../typeAction/appWl.action";

import {
    outboxProcessOnce, outboxSuspendRequested

} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import {
    wsDisconnectRequested,
    wsEnsureConnectedRequested

} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";
import {outboxWatchdogTick} from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";



const isSignedIn = (state: RootStateWl) => state.aState?.status === "signedIn";

export const runtimeListenerFactory = () => {
    const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
    const listen = runtimeListener.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    const kickOnlineAuthed = (api: { dispatch: AppDispatchWl; getState: () => RootStateWl }) => {
        // WS
        api.dispatch(wsEnsureConnectedRequested());
        // delivery
        api.dispatch(outboxProcessOnce());
        // observation (rattrapage ACK manquant)
        api.dispatch(outboxWatchdogTick());
    };

    listen({
        actionCreator: appBecameActive,
        effect: async (_, api) => {
            const signedIn = isSignedIn(api.getState());
            console.log("[APP RUNTIME] appBecameActive", { signedIn });

            if (!signedIn) return;

            kickOnlineAuthed(api);
        },
    });

    listen({
        actionCreator: appConnectivityChanged,
        effect: async (action, api) => {
            const signedIn = isSignedIn(api.getState());

            if (!action.payload.online) {
                console.log("[APP RUNTIME] connectivity offline: disconnect ws + suspend outbox");
                api.dispatch(wsDisconnectRequested());
                api.dispatch(outboxSuspendRequested()); // ✅ cohérent
                return;
            }

            console.log("[APP RUNTIME] connectivity online", { signedIn });

            if (!signedIn) {
                console.log("[APP RUNTIME] online: skip ws/outbox/watchdog (not signedIn)");
                return;
            }

            kickOnlineAuthed(api);
        },
    });

    listen({
        actionCreator: appBecameBackground,
        effect: async (_, api) => {
            console.log("[APP RUNTIME] appBecameBackground: suspend outbox + ws disconnect");
            api.dispatch(outboxSuspendRequested());
            api.dispatch(wsDisconnectRequested());
        },
    });

    return runtimeListener.middleware;
};
