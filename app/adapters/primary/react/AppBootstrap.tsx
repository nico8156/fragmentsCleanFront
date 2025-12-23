import { useEffect } from "react";
import { useStore } from "react-redux";
import type { ReduxStoreWl, RootStateWl } from "@/app/store/reduxStoreWl";

import {
    appBootFailed,
    appBootSucceeded,
    appHydrationDone,
    appWarmupDone,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import { mountAppStateAdapter } from "@/app/adapters/primary/runtime/appState.adapter";
import { mountNetInfoAdapter } from "@/app/adapters/primary/runtime/netInfo.adapter";

import { initializeAuth } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { requestPermission, getOnceRequested } from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";

import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { onCfPhotoRetrieval } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { onOpeningHourRetrieval } from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";

import { outboxStorage } from "@/app/adapters/primary/react/wiring/setupGateways";

// ✅ optionnel : dev flag explicite (au lieu d’un clear “sauvage”)
const CLEAR_OUTBOX_ON_BOOT = false;

const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });

const selectUserIdForEntitlements = (state: any): string | undefined => {
    return (
        state?.aState?.session?.userId ??
        state?.aState?.currentUser?.id ??
        state?.auth?.userId ??
        state?.user?.id ??
        undefined
    );
};

export const AppBootstrap = () => {
    const store = useStore() as unknown as ReduxStoreWl;

    useEffect(() => {
        console.log("[BOOT] AppBootstrap mounted");

        const unmountNetInfo = mountNetInfoAdapter(store, { dispatchInitial: true });
        const unmountAppState = mountAppStateAdapter(store);

        console.log("[BOOT] NetInfo + AppState adapters mounted");

        let cancelled = false;
        const dispatch: any = store.dispatch;

        const bootRuntime = async () => {
            // 1) Hydration "app"
            // (si redux-persist : remplace par le vrai signal rehydrate)
            store.dispatch(appHydrationDone());

            // 2) Auth early
            await dispatch(initializeAuth());

            // 3) Outbox rehydrate
            if (__DEV__ && CLEAR_OUTBOX_ON_BOOT) {
                console.log("[BOOT] DEV: clearing outbox storage (flag enabled)");
                await outboxStorage.clear();
            }

            console.log("[BOOT] Rehydrate outbox: start");
            const snapshot = await runRehydrateOutbox(store);
            console.log("[BOOT] Rehydrate outbox: done, queue length =", snapshot.queue.length);

            if (cancelled) return;

            // 4) Si outbox non vide => process once
            if (snapshot.queue.length) {
                store.dispatch(outboxProcessOnce());
            }
        };

        const warmupData = async () => {
            // Location permissions + once
            store.dispatch(requestPermission());
            store.dispatch(getOnceRequested({ accuracy: "high" }));

            // Global data
            await dispatch(coffeeGlobalRetrieval());
            await dispatch(onCfPhotoRetrieval());
            await dispatch(onOpeningHourRetrieval());

            // Entitlements (si userId connu)
            const uid = selectUserIdForEntitlements(store.getState());
            if (uid) {
                await dispatch(entitlementsRetrieval({ userId: uid }));
            }
        };

        (async () => {
            try {
                await bootRuntime();
                if (cancelled) return;

                await warmupData();
                if (cancelled) return;

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
