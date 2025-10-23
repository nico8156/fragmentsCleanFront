import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {createListenerMiddleware, TypedStartListening} from "@reduxjs/toolkit";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";

export const runtimeListenerFactory =
    (deps:DependenciesWl, callback?:()=> void) => {
        const runtimeListener = createListenerMiddleware()
        const listener = runtimeListener.startListening as TypedStartListening<AppStateWl, AppDispatchWl>
            listener({
                actionCreator:
            })

        return runtimeListener.middleware
    }