import {
    configureStore,
    Middleware,
    ThunkAction,
} from "@reduxjs/toolkit";
import { DependenciesWl} from "@/app/store/appStateWl";
import { commentWlReducer as cState } from "@/app/contextWL/commentWl/reducer/commentWl.reducer"
import { outboxWlReducer as oState } from "@/app/contextWL/outboxWl/reducer/outboxWl.reducer"
import { likeWlReducer as lState } from "@/app/contextWL/likeWl/reducer/likeWl.reducer"
import { ticketWlReducer as tState } from "@/app/contextWL/ticketWl/reducer/ticketWl.reducer"
import {entitlementWlReducer as enState} from "@/app/contextWL/entitlementWl/reducer/entitlementWl.reducer"
import {coffeeWlReducer as cfState} from "@/app/contextWL/coffeeWl/reducer/coffeeWl.reducer"
import { cfPhotoReducer as pState} from "@/app/contextWL/cfPhotosWl/reducer/cfPhoto.reducer"
import {openingHoursReducer as ohState} from"@/app/contextWL/openingHoursWl/reducer/openinghours.reducer"
import {locationReducer as lcState} from "@/app/contextWL/locationWl/reducer/location.reducer";
import {articleWlReducer as arState} from "@/app/contextWL/articleWl/reducer/articleWl.reducer";
import {authReducer} from "@/app/contextWL/userWl/reducer/user.reducer";

export const initReduxStoreWl = (config: {
    dependencies: Partial<DependenciesWl>;
    listeners?: Middleware[];
    extraMiddlewares?: Middleware[];
    extraReducers?: Record<string, any>;
}) => {
    return configureStore({
        reducer: {
            cState,
            oState,
            lState,
            tState,
            enState,
            cfState,
            lcState,
            pState,
            ohState,
            arState,
            authState: authReducer,
            ...(config.extraReducers ?? {})
        },
        middleware: (getDefaultMiddleware) => {
            const middleware = getDefaultMiddleware({
                thunk: {
                    extraArgument: config.dependencies?.gateways,
                },
                serializableCheck: false,
            });
            const withMiddleware = config.listeners ? middleware.prepend(...config.listeners) : middleware;
            const withCustomMiddleware = config.extraMiddlewares ? withMiddleware.prepend(...config.extraMiddlewares) : withMiddleware;
            return withCustomMiddleware;
        },
        devTools: true,
    });
};

// ========= Types DÉRIVÉS du store =========
export type ReduxStoreWl = ReturnType<typeof initReduxStoreWl>;
export type RootStateWl = ReturnType<ReduxStoreWl["getState"]>;
export type AppDispatchWl = ReduxStoreWl["dispatch"];

export type ExtraArgWl = DependenciesWl["gateways"] | undefined;

// Thunk “canonique”
export type AppThunkWl<ReturnType = void> = ThunkAction<
    ReturnType,
    RootStateWl,
    ExtraArgWl,
    { type: string }
>;