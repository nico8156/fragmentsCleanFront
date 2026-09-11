import {
    configureStore,
    combineReducers,
    Middleware,
    ThunkAction,
} from "@reduxjs/toolkit";
import { accountScopedThunks, accountStorageReady, accountStorageFailed } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";
import { DependenciesWl} from "@/app/store/appStateWl";
import { commentWlReducer as cState } from "@/app/core-logic/contextWL/commentWl/reducer/commentWl.reducer"
import { outboxWlReducer as oState } from "@/app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer"
import { likeWlReducer as lState } from "@/app/core-logic/contextWL/likeWl/reducer/likeWl.reducer"
import { savedCoffeeReducer as scState } from "@/app/core-logic/contextWL/savedCoffeeWl/reducer/savedCoffee.reducer";
import { ticketWlReducer as tState } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer"
import {entitlementWlReducer as enState} from "@/app/core-logic/contextWL/entitlementWl/reducer/entitlementWl.reducer"
import {coffeeWlReducer as cfState} from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer"
import { cfPhotoReducer as pState} from "@/app/core-logic/contextWL/cfPhotosWl/reducer/cfPhoto.reducer"
import {openingHoursReducer as ohState} from "@/app/core-logic/contextWL/openingHoursWl/reducer/openinghours.reducer"
import {locationReducer as lcState} from "@/app/core-logic/contextWL/locationWl/reducer/location.reducer";
import {articleWlReducer as arState} from "@/app/core-logic/contextWL/articleWl/reducer/articleWl.reducer";
import {authReducer as aState} from "@/app/core-logic/contextWL/userWl/reducer/user.reducer";
import {appReducer as appState} from "@/app/core-logic/contextWL/appWl/reducer/app.reducer";
import { projectionSyncReducer as psState } from "@/app/core-logic/contextWL/projectionSyncWl/reducer/projectionSync.reducer";
import { experienceReducer as exState } from "@/app/core-logic/contextWL/experienceWl/reducer/experience.reducer";


export const initReduxStoreWl = (config: {
    dependencies: Partial<DependenciesWl>;
    listeners?: Middleware[];
    extraMiddlewares?: Middleware[];
    extraReducers?: Record<string, any>;
    accountStorageManaged?: boolean;
}) => {
    const combined = combineReducers({
            cState,
            exState,
            oState,
            lState,
            scState,
            tState,
            enState,
            cfState,
            lcState,
            pState,
            ohState,
            arState,
            aState,
            appState,
            psState,
            accountScope: (state = { generation: 0, ready: !config.accountStorageManaged, error: undefined as string | undefined }) => state,
            ...(config.extraReducers ?? {})
        });
    const reducer = (state: ReturnType<typeof combined> | undefined, action: any): ReturnType<typeof combined> => {
        let next = combined(state, action);
        if (state && state.aState.session?.userId !== next.aState.session?.userId) {
            const empty = combined(undefined, { type: "@@account/reset" });
            next = { ...next, cState: empty.cState, exState: empty.exState, lState: empty.lState, scState: empty.scState,
				aState: { ...next.aState, currentUser: undefined, profileStatus: "idle", profileError: undefined },
                tState: empty.tState, enState: empty.enState, oState: empty.oState, psState: empty.psState,
                lcState: empty.lcState,
                accountScope: { generation: state.accountScope.generation + 1, ready: !config.accountStorageManaged, error: undefined } };
        }
        if (accountStorageReady.match(action) && action.payload.generation === next.accountScope.generation) {
            next = { ...next, accountScope: { ...next.accountScope, ready: true, error: undefined } };
        }
        if (accountStorageFailed.match(action) && action.payload.generation === next.accountScope.generation) {
            next = { ...next, accountScope: { ...next.accountScope, ready: false, error: action.payload.error } };
        }
        return next;
    };
    return configureStore({
        reducer,
        middleware: (getDefaultMiddleware) => {
            const middleware = getDefaultMiddleware({
                thunk: {
                    extraArgument: config.dependencies?.gateways,
                },
                serializableCheck: false,
            });
            const withMiddleware = config.listeners ? middleware.prepend(...config.listeners) : middleware;
            const withCustomMiddleware = config.extraMiddlewares ? withMiddleware.prepend(...config.extraMiddlewares) : withMiddleware;
            return withCustomMiddleware.prepend(accountScopedThunks);
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
