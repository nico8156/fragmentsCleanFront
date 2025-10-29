import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {
    getOnceRequested,
    locationUpdated, permissionCheckRequested,
    permissionUpdated,
    requestPermission,
    startWatchRequested,
    stopWatchRequested,
    watchError,
    watchStarted,
    watchStopped
} from "@/app/contextWL/locationWl/typeAction/location.action"

export const userLocationListenerFactory = (deps:DependenciesWl) => {
    const mw = createListenerMiddleware()
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>

    listen({
        actionCreator: permissionCheckRequested,
        effect: async (_, api) => {
            if (!deps.gateways.locations) return
            try {
                const status = await deps.gateways.locations.getPermissionStatus();
                console.log('permissionCheckRequested', status)
                api.dispatch(permissionUpdated ({status}));
            } catch (e: any) {
                api.dispatch(watchError({scope: 'permission', message: e?.message ?? String(e)}));
            }
        }
    })
    listen({
        actionCreator: requestPermission,
        effect: async (_, api) => {
            if (!deps.gateways.locations) return
            try {
                const status = await deps.gateways.locations.requestPermission();
                api.dispatch(permissionUpdated ({status}));
            } catch (e: any) {
                api.dispatch(watchError({scope: 'permission', message: e?.message ?? String(e)}));
            }
        }
    })
    listen({
        actionCreator:getOnceRequested,
        effect:async (action,api)=>{
            if (!deps.gateways.locations) return
            try {
                const coords = await deps.gateways.locations.getCurrentPosition(action.payload);
                api.dispatch( locationUpdated({ coords, at: Date.now()}));
            } catch (e:any) {
                api.dispatch(watchError({ scope: 'getOnce', message: e?.message ?? String(e) }));
            }
        }
    })

    let sub: { remove(): void } | null = null;

    listen({
        actionCreator:startWatchRequested,
        effect:async (action,api) => {
            if (!deps.gateways.locations) return
            try {
                if (sub) sub.remove();
                sub = await deps.gateways.locations.watchPosition(
                    action.payload ?? { accuracy: 'balanced', distanceInterval: 50 },
                    (coords) => api.dispatch(locationUpdated({ coords, at: Date.now()})),
                    (err) => api.dispatch(watchError({ scope: 'watch', message: String(err) }))
                );
                api.dispatch(watchStarted());
            } catch (e:any) {
                api.dispatch(watchError({ scope: 'watch', message: e?.message ?? String(e) }));
            }
        }
    })
    listen({
        actionCreator:stopWatchRequested,
        effect:async (_,api)=>{
            try { sub?.remove(); } finally {
                sub = null;
                api.dispatch(watchStopped());
            }
        }
    })

    return mw.middleware
}