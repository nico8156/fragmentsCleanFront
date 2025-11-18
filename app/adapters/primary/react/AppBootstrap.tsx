// /app/adapters/primary/react/AppBootstrap.tsx
import { useEffect } from "react";
import { useStore } from "react-redux";
import type {ReduxStoreWl, RootStateWl} from "@/app/store/reduxStoreWl";

import { mountAppStateAdapter } from "@/app/adapters/primary/react/gateways-config/appState.adapter";
import { mountNetInfoAdapter } from "@/app/adapters/primary/react/gateways-config/netInfo.adapter";

import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { outboxStorage } from "@/app/adapters/primary/react/wiring/setupGateways";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";

const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });

export const AppBootstrap = () => {
    const store = useStore<RootStateWl>();

    useEffect(() => {
        const unmountNetInfo = mountNetInfoAdapter(store);
        const unmountAppState = mountAppStateAdapter(store);

        let cancelled = false;

        (async () => {
            const snapshot = await runRehydrateOutbox(store);
            if (cancelled) return;

            if (snapshot.queue.length) {
                store.dispatch(outboxProcessOnce());
            }
            store.dispatch(replayRequested());
            store.dispatch(syncDecideRequested());
        })();

        return () => {
            cancelled = true;
            unmountAppState();
            unmountNetInfo();
        };
    }, [store]);

    return null;
};
