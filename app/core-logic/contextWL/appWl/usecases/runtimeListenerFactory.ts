// appWl/runtimeListenerFactory.ts
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import {
    appBecameActive,
    appConnectivityChanged,
} from "../typeAction/appWl.action";
import {
    outboxProcessOnce,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";

export const runtimeListenerFactory = () => {
    const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
    const listener = runtimeListener.startListening as TypedStartListening<
        RootStateWl,
        AppDispatchWl
    >;

    listener({
        actionCreator: appBecameActive,
        effect: async (_, api) => {
            console.log("[APP RUNTIME] appBecameActive: resume outbox + sync");
            api.dispatch(outboxProcessOnce());
            api.dispatch(replayRequested());
            api.dispatch(syncDecideRequested());
        },
    });

    listener({
        actionCreator: appConnectivityChanged,
        effect: async (action, api) => {
            if (action.payload.online) {
                console.log("[APP RUNTIME] appConnectivityChanged: online, resume outbox + sync");
                api.dispatch(outboxProcessOnce());
                api.dispatch(syncDecideRequested());
            }
        },
    });

    return runtimeListener.middleware;
};
