import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";

import {
    outboxProcessOnce,
    outboxSuspendRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import {
    wsEnsureConnectedRequested,
    wsDisconnectRequested,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import {
    appBecameActive,
    appBecameBackground,
    appBecameInactive,
    appConnectivityChanged
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

const isSignedIn = (state: RootStateWl) => state.aState?.status === "signedIn";

export const runtimeListenerFactory = () => {
    const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
    const listen = runtimeListener.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

    const kickOnlineAuthed = (api: { dispatch: AppDispatchWl; getState: () => RootStateWl }) => {
        // Si offline, on ne force rien (ça évite des logs/bruit)
        if (!selectIsOnline(api.getState())) return;

        api.dispatch(wsEnsureConnectedRequested());
        api.dispatch(outboxProcessOnce());
        api.dispatch(outboxWatchdogTick());
    };

    const suspendRuntime = (api: { dispatch: AppDispatchWl }) => {
        api.dispatch(outboxSuspendRequested());
        api.dispatch(wsDisconnectRequested());
    };

    // ---- Active => (re)connect + process + watchdog (si signedIn)
    listen({
        actionCreator: appBecameActive,
        effect: async (_, api) => {
            const signedIn = isSignedIn(api.getState());
            console.log("[APP RUNTIME] appBecameActive", { signedIn });

            if (!signedIn) return;
            kickOnlineAuthed(api);
        },
    });

    // ---- Inactive => traité comme background (fiabilité WS)
    listen({
        actionCreator: appBecameInactive,
        effect: async (_, api) => {
            console.log("[APP RUNTIME] appBecameInactive: suspend outbox + ws disconnect");
            suspendRuntime(api);
        },
    });

    // ---- Background => suspend + disconnect
    listen({
        actionCreator: appBecameBackground,
        effect: async (_, api) => {
            console.log("[APP RUNTIME] appBecameBackground: suspend outbox + ws disconnect");
            suspendRuntime(api);
        },
    });

    // ---- Connectivity changes
    listen({
        actionCreator: appConnectivityChanged,
        effect: async (action, api) => {
            const signedIn = isSignedIn(api.getState());

            if (!action.payload.online) {
                console.log("[APP RUNTIME] connectivity offline: disconnect ws + suspend outbox");
                suspendRuntime(api);
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

    return runtimeListener.middleware;
};
