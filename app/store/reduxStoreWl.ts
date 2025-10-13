import {
    Action,
    configureStore,
    Middleware,
    ThunkAction,
    ThunkDispatch,
} from "@reduxjs/toolkit";
import {Gateways} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import { commentWlReducer as cState } from "@/app/contextWL/commentWl/reducer/commentWl.reducer"
import { outboxWlReducer as oState } from "@/app/contextWL/outboxWl/reducer/outboxWl.reducer"

export const initReduxStoreWl = (config: {
    dependencies: Partial<DependenciesWl>;
    listeners?: Middleware[];
    extraReducers?: Record<string, any>;
}) => {
    return configureStore({
        reducer: {
            cState,
            oState,
            ...(config.extraReducers ?? {}), // 👈 ajoute ça
        },
        middleware: (getDefaultMiddleware) => {
            const middleware = getDefaultMiddleware({
                thunk: {
                    extraArgument: config.dependencies,
                },
                serializableCheck: false,
            });
            return config.listeners
                ? middleware.prepend(...config.listeners)
                : middleware;
        },
        devTools: true,
    });
};

export type ReduxStoreWl = ReturnType<typeof initReduxStoreWl>;

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    AppStateWl,
    DependenciesWl,
    Action
>;

export type AppDispatchWl = ThunkDispatch<AppStateWl,Gateways, Action>;
