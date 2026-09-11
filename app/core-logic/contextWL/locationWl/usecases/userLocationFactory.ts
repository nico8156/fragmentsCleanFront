import {DependenciesWl} from "@/app/store/appStateWl";
import {TypedStartListening} from "@reduxjs/toolkit";
import { createListenerMiddleware, accountGeneration } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";
import {AppDispatchWl, RootStateWl} from "@/app/store/reduxStoreWl";
import {
    getOnceRequested, locationNearbyCafeUpdated,
    locationUpdated, permissionCheckRequested,
    permissionUpdated,
    requestPermission,
    userLocationRequested,
    startWatchRequested,
    stopWatchRequested,
    watchError,
    watchStarted,
    watchStopped
} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action"
import {selectCoffeesList} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import {findClosestCafeWithinRadius} from "@/app/core-logic/utils/geo/distance";

export const userLocationListenerFactory = (deps:DependenciesWl) => {
    const mw = createListenerMiddleware()
    const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>

    listen({
        actionCreator: permissionCheckRequested,
        effect: async (_, api) => {
            if (!deps.gateways.locations) return
            try {
                const status = await deps.gateways.locations.getPermissionStatus();
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
        actionCreator: userLocationRequested,
        effect: async (_, api) => {
            if (!deps.gateways.locations) return;
            try {
                let status = await deps.gateways.locations.getPermissionStatus();
                if (status === "undetermined") {
                    status = await deps.gateways.locations.requestPermission();
                }
                api.dispatch(permissionUpdated({ status }));
                if (status === "granted") {
                    api.dispatch(getOnceRequested({ accuracy: "balanced" }));
                }
            } catch (e: any) {
                api.dispatch(watchError({ scope: "permission", message: e?.message ?? String(e) }));
            }
        },
    });
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
    let watchEpoch = 0;

    listen({
        predicate: (_, current, previous) => accountGeneration(current) !== accountGeneration(previous),
        effect: (_, api) => {
            ++watchEpoch;
            sub?.remove();
            sub = null;
            api.dispatch(watchStopped());
        },
    });

    listen({
        actionCreator:startWatchRequested,
        effect:async (action,api) => {
            if (!deps.gateways.locations) return
            const attempt = ++watchEpoch;
            try {
                if (sub) sub.remove();
                const nextSub = await deps.gateways.locations.watchPosition(
                    action.payload ?? { accuracy: 'balanced', distanceInterval: 50 },
                    (coords) => api.dispatch(locationUpdated({ coords, at: Date.now()})),
                    (err) => api.dispatch(watchError({ scope: 'watch', message: String(err) }))
                );
                if (attempt !== watchEpoch) { nextSub.remove(); return; }
                sub = nextSub;
                api.dispatch(watchStarted());
            } catch (e:any) {
                api.dispatch(watchError({ scope: 'watch', message: e?.message ?? String(e) }));
            }
        }
    })
    listen({
        actionCreator:stopWatchRequested,
        effect:async (_,api)=>{
            ++watchEpoch;
            try { sub?.remove(); } finally {
                sub = null;
                api.dispatch(watchStopped());
            }
        }
    })
    listen({
        actionCreator: locationUpdated,
        effect: async (action, api) => {
            const state = (api.getState()) as RootStateWl;

            const cafes = selectCoffeesList(state as RootStateWl)
            const { coords } = action.payload;

            // à adapter au shape exact de coords (latitude/longitude vs lat/lng)
            const pos = {
                lat: coords.lat,
                lng: coords.lng,
            };

            const result = findClosestCafeWithinRadius(pos, cafes, 100); // 100m par ex.

            api.dispatch(
                locationNearbyCafeUpdated({
                    cafeId: result?.cafeId,
                    distanceMeters: result?.distanceMeters,
                    seenAt: Date.now(),
                }),
            );
        },
    });


    return mw.middleware
}
