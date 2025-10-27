import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {getLocationSuccess, userLocationRequested} from "@/app/contextWL/locationWl/typeAction/location.action";


export const listenerLocationRequestedFactory =
    (deps:DependenciesWl) => {
    const mw = createListenerMiddleware()
    const listen = mw.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listen({
        actionCreator:userLocationRequested,
        effect: async (_, api) => {
            if(!deps.gateways.locations) return
            const coordinates = await deps.gateways.locations.get()
            api.dispatch(getLocationSuccess({coordinates}))
        }
    })

        return mw.middleware
}