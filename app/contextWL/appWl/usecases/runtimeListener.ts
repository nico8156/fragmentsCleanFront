import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {
    appBecameActive,
    appBootFailed,
    appBootRequested,
    appBootSucceeded, appConnectivityChanged,
    appHydrationDone,
    appWarmupDone
} from "@/app/contextWL/appWl/typeAction/appWl.action";
import {entitlementsRetrieval} from "@/app/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import {outboxProcessOnce} from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {coffeeGlobalRetrieval} from "@/app/contextWL/coffeeWl/usecases/read/coffeeRetrieval";

export const runtimeListenerFactory =
    (deps:DependenciesWl, callback?:()=> void) => {
        const runtimeListener = createListenerMiddleware()
        const listener = runtimeListener.startListening as TypedStartListening<AppStateWl, AppDispatchWl>
            listener({
                actionCreator:appBootRequested,
                effect: async (action, api) => {
                    try {
                        // Hydration (si redux-persist – sinon dispatch directement done)
                        api.dispatch(appHydrationDone());

                        // Warmup (fetch global léger)
                        await api.dispatch<any>(coffeeGlobalRetrieval());
                        // Entitlements de l’utilisateur si connu (facultatif)
                        const uid = (api.getState() as any).auth?.userId;
                        if (uid) await api.dispatch<any>(entitlementsRetrieval({ authorId: uid }));

                        api.dispatch(appWarmupDone({message: "Warmup OK"}));
                        api.dispatch(appBootSucceeded());

                        // À la fin du boot, traiter l’outbox si offline->online
                        api.dispatch(outboxProcessOnce());
                    } catch (e: any) {
                        api.dispatch(appBootFailed({ message: String(e?.message ?? e) }));
                    }

                    if (callback) {
                        callback();
                    }
                }
            })
        listener({
            actionCreator:appBecameActive,
            effect: async (action, api) => {
                api.dispatch(outboxProcessOnce());
                if (callback) {
                    callback();
                }
            }
        })
        listener({
            actionCreator:appConnectivityChanged,
            effect: async (action, api) => {
                api.dispatch(outboxProcessOnce());
                if (callback) {
                    callback();
                }
            }
        })

        return runtimeListener.middleware
    }