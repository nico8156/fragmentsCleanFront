import { useEffect } from "react";
import { useStore } from "react-redux";
import type { ReduxStoreWl } from "@/app/store/reduxStoreWl";

import {
    appBootFailed,
    appBootSucceeded,
    appHydrationDone,
    appWarmupDone,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import { mountNetInfoAdapter } from "@/app/adapters/primary/runtime/netInfo.adapter";
import { mountAppStateAdapter } from "@/app/adapters/primary/runtime/appState.adapter";

import { initializeAuth } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { requestPermission, getOnceRequested } from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";

import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { onCfPhotoRetrieval } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { onOpeningHourRetrieval } from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";

import { outboxStorage } from "@/app/adapters/primary/react/wiring/setupGateways";
import { selectIsOnline } from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";

// ---- dev guard (jamais en prod) ----
const CLEAR_OUTBOX_ON_BOOT = false;

const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });

const selectUserIdForEntitlements = (state: any): string | undefined =>
    state?.aState?.session?.userId ??
    state?.aState?.currentUser?.id ??
    state?.auth?.userId ??
    state?.user?.id ??
    undefined;

const isSignedIn = (state: any): boolean => state?.aState?.status === "signedIn";

export const AppBootstrap = () => {
    const store = useStore() as unknown as ReduxStoreWl;

    useEffect(() => {
        console.log("[BOOT] AppBootstrap mounted");

        // 0) Adapters (runtime signals)
        const unmountNetInfo = mountNetInfoAdapter(store);
        const unmountAppState = mountAppStateAdapter(store, { ignoreFirstActive: false });

        console.log("[BOOT] NetInfo + AppState adapters mounted");

        let cancelled = false;
        const dispatch: any = store.dispatch;

        const bootRuntime = async () => {
            // 1) Hydration app
            store.dispatch(appHydrationDone());

            // 2) Auth early (charge session secure store)
            await dispatch(initializeAuth());
            if (cancelled) return;

            // 3) Outbox storage (DEV only)
            if (__DEV__ && CLEAR_OUTBOX_ON_BOOT) {
                console.log("[BOOT] DEV: clearing outbox storage (flag enabled)");
                await outboxStorage.clear();
            }

            // 4) Outbox rehydrate
            console.log("[BOOT] Rehydrate outbox: start");
            const snapshot = await runRehydrateOutbox(store);
            console.log("[BOOT] Rehydrate outbox: done, queue length =", snapshot.queue.length);
            if (cancelled) return;

            // 5) Optionnel: kick outbox once si on est déjà authed + online
            // (sinon runtimeListener fera le job à appBecameActive / connectivity online)
            const stateNow: any = store.getState();
            if (snapshot.queue.length && isSignedIn(stateNow) && selectIsOnline(stateNow)) {
                store.dispatch(outboxProcessOnce());
            }
        };

        const warmupData = async () => {
            // Location permissions + once (ne bloque pas le boot si ça échoue)
            try {
                store.dispatch(requestPermission());
                store.dispatch(getOnceRequested({ accuracy: "high" }));
            } catch {}

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
