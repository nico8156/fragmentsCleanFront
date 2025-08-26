import {
    Action,
    configureStore,
    ListenerMiddleware,
    Store,
    ThunkAction,
    ThunkDispatch,
} from "@reduxjs/toolkit";
import { AppState } from "./appState";
import {Gateways} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import {coffeeRetrievalReducer as coffeeRetrieval} from "@/app/core-logic/reducers/coffeeRetrievalReducer";
import {commentRetrievalReducer as commentRetrieval} from "@/app/core-logic/reducers/commentRetrievalReducer";

export const initReduxStore = (config: {
    gateways?: Partial<Gateways>;
    listeners?: ListenerMiddleware[];
    //pyramidSteps?: number[];
    //pyramidValues?: string[];
}) => {
    return configureStore({
        reducer: {
            coffeeRetrieval,
            commentRetrieval,
        },
        middleware: (getDefaultMiddleware) => {
            const middleware = getDefaultMiddleware({
                thunk: {
                    extraArgument: config.gateways,
                },
                serializableCheck: false,
            });
            return config.listeners
                ? middleware.prepend(config.listeners)
                : middleware;
        },
        devTools: true,
    });
};

export type ReduxStore = Store<AppState> & {
    dispatch: ThunkDispatch<AppState, Gateways, Action>;
};

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    AppState,
    Gateways,
    Action
>;

export type AppDispatch = ThunkDispatch<AppState, Gateways, Action>;
