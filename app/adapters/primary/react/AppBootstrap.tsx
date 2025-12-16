import {entitlementsRetrieval} from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import {
    appBootFailed,
    appBootSucceeded,
    appHydrationDone,
    appWarmupDone
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import {onOpeningHourRetrieval} from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import {onCfPhotoRetrieval} from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import {getOnceRequested, requestPermission} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";
import {initializeAuth} from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

import {outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {mountAppStateAdapter} from "@/app/adapters/primary/gateways-config/appState.adapter";
import {mountNetInfoAdapter} from "@/app/adapters/primary/gateways-config/netInfo.adapter";
import {useEffect} from "react";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import { useStore } from "react-redux";
import {rehydrateOutboxFactory} from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import {outboxStorage} from "@/app/adapters/primary/react/wiring/setupGateways";

const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });

export const AppBootstrap = () => {
    const store = useStore<RootStateWl>();

    useEffect(() => {
        console.log("[BOOT] AppBootstrap mounted");

        const unmountNetInfo = mountNetInfoAdapter(store);
        const unmountAppState = mountAppStateAdapter(store);

        console.log("[BOOT] NetInfo + AppState adapters mounted");

        let cancelled = false;

        (async () => {
            const dispatch: any = store.dispatch;

            try {
                // 1. hydratation app (si redux-persist)
                console.log("[BOOT] DEV: clearing outbox storage");
                await outboxStorage.clear();
                console.log("[BOOT] appHydrationDone");
                store.dispatch(appHydrationDone());
                console.log("[BOOT] Init auth (early)");
                await dispatch(initializeAuth());
                // 2. rehydrate outbox + premier process
                console.log("[BOOT] Rehydrate outbox: start");
                const snapshot = await runRehydrateOutbox(store);
                console.log(
                    "[BOOT] Rehydrate outbox: done, queue length =",
                    snapshot.queue.length,
                );

                if (cancelled) {
                    console.log("[BOOT] cancelled after rehydrate, skip rest");
                    return;
                }

                if (snapshot.queue.length) {
                    console.log("[BOOT] Outbox not empty, dispatch outboxProcessOnce");
                    store.dispatch(outboxProcessOnce());
                }

                // 3. premier sync events (équivalent à ce que tu faisais en fin de boot)
                // console.log("[BOOT] Dispatch replayRequested");
                // store.dispatch(replayRequested());
                //
                // console.log("[BOOT] Dispatch syncDecideRequested");
                // store.dispatch(syncDecideRequested());

                console.log("[BOOT] Request location permission");
                store.dispatch(requestPermission());
                store.dispatch(getOnceRequested({ accuracy: "high" }));

                // 5. data globales (fake cafés, photos, horaires)
                console.log("[BOOT] Load coffees");
                await dispatch(coffeeGlobalRetrieval());

                console.log("[BOOT] Load cfPhotos");
                await dispatch(onCfPhotoRetrieval());

                console.log("[BOOT] Load openingHours");
                await dispatch(onOpeningHourRetrieval());

                // 6. entitlements user si connu
                const state: any = store.getState();
                const uid =
                    state.auth?.userId ??
                    state.aState?.currentUser?.id ??
                    state.user?.id;

                if (uid) {
                    console.log("[BOOT] Load entitlements for user", uid);
                    await dispatch(entitlementsRetrieval({ userId: uid }));
                } else {
                    console.log("[BOOT] No userId for entitlements yet");
                }

                // 7. warmup + succès
                store.dispatch(appWarmupDone({ message: "Warmup OK" }));
                store.dispatch(appBootSucceeded());
                console.log("[BOOT] App boot succeeded");
            } catch (e: any) {
                console.log("[BOOT] App boot failed", e);
                store.dispatch(appBootFailed({ message: String(e?.message ?? e) }));
            }
        })();

        return () => {
            console.log("[BOOT] AppBootstrap unmount");
            cancelled = true;
            unmountAppState();
            unmountNetInfo();
            console.log("[BOOT] NetInfo + AppState adapters unmounted");
        };
    }, [store]);

    return null;
};
