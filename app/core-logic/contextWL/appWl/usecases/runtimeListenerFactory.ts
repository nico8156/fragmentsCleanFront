// appWl/runtimeListenerFactory.ts
import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { replayRequested, syncDecideRequested } from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";
import {  outboxStorage } from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppDispatchWl, AppThunkWl, ReduxStoreWl, RootStateWl} from "@/app/store/reduxStoreWl";
import {
    appBecameActive,
    appBootFailed,
    appBootRequested,
    appBootSucceeded, appConnectivityChanged,
    appHydrationDone,
    appWarmupDone
} from "../typeAction/appWl.action";
import { initializeAuth } from "../../userWl/usecases/auth/authUsecases";
import {getOnceRequested, requestPermission} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";
import {coffeeGlobalRetrieval} from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import {onCfPhotoRetrieval} from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import {onOpeningHourRetrieval} from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import {entitlementsRetrieval} from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import {outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

const runRehydrateOutbox = rehydrateOutboxFactory({ storage: outboxStorage });

export const runtimeListenerFactory =
    (deps: DependenciesWl, callback?: () => void) => {
        const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
        const listener = runtimeListener.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

        listener({
            actionCreator: appBootRequested,
            effect: async (_, api) => {
                const dispatch = api.dispatch

                try {
                    // 1. hydratation app (si redux-persist)
                    api.dispatch(appHydrationDone());

                    // 2. rehydrate outbox + premier process
                    const snapshot = await runRehydrateOutbox(api as any as ReduxStoreWl);
                    if (snapshot.queue.length) {
                        api.dispatch(outboxProcessOnce());
                    }

                    // 3. init auth + location + data globales
                    dispatch<any>(initializeAuth());
                    api.dispatch(requestPermission());
                    api.dispatch(getOnceRequested({ accuracy: "high" }));
                    await api.dispatch<any>(coffeeGlobalRetrieval());
                    await api.dispatch<any>(onCfPhotoRetrieval());
                    await api.dispatch<any>(onOpeningHourRetrieval());

                    // 4. entitlements user si connu
                    const uid = (api.getState() as any).auth?.userId;
                    if (uid) {
                        await api.dispatch<any>(entitlementsRetrieval({ userId: uid }));
                    }

                    // 5. premier sync events
                    api.dispatch(replayRequested());
                    api.dispatch(syncDecideRequested());

                    api.dispatch(appWarmupDone({ message: "Warmup OK" }));
                    api.dispatch(appBootSucceeded());
                } catch (e: any) {
                    api.dispatch(appBootFailed({ message: String(e?.message ?? e) }));
                }
                callback?.();
            },
        });

        listener({
            actionCreator: appBecameActive,
            effect: async (_, api) => {
                // reprise : outbox + sync
                api.dispatch(outboxProcessOnce());
                api.dispatch(replayRequested());
                api.dispatch(syncDecideRequested());
                callback?.();
            },
        });

        listener({
            actionCreator: appConnectivityChanged,
            effect: async (action, api) => {
                if (action.payload.online) {
                    api.dispatch(outboxProcessOnce());
                    api.dispatch(syncDecideRequested());
                }
                callback?.();
            },
        });

        return runtimeListener.middleware;
    };
