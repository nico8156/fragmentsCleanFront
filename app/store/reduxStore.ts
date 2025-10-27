// import {
//     Action,
//     configureStore,
//     Middleware,
//     ThunkAction,
//     ThunkDispatch,
// } from "@reduxjs/toolkit";
// import { AppState } from "./appState";
// import {coffeeRetrievalReducer as coffeeRetrieval} from "@/app/core-logic/reducers/coffeeRetrievalReducer";
// import {commentRetrievalReducer as commentRetrieval} from "@/app/core-logic/reducers/commentRetrievalReducer";
// import {likeRetrievalReducer as likeRetrieval} from "@/app/core-logic/reducers/likeRetrievalReducer";
// import {ticketReducer as ticketState} from "@/app/core-logic/reducers/ticketReducer";
// import {authReducer as authState} from "@/app/core-logic/reducers/authReducer";
// import { exchangesReducer as exchangesByKey} from "@/app/core-logic/reducers/exchangesReducer";
// import {Gateways} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
// import {outboxLikeReducer as likeOutbox} from "@/app/contexts/like/reducer/outbox.like.reducer";
// import {likeReducer as likes} from "@/app/contexts/like/reducer/like.reducer";
//
//
// export const initReduxStore = (config: {
//     gateways?: Partial<Gateways>;
//     listeners?: Middleware[];
//     extraReducers?: Record<string, any>;
// }) => {
//     return configureStore({
//         reducer: {
//             coffeeRetrieval,
//             commentRetrieval,
//             likeRetrieval,
//             ticketState,
//             authState,
//             exchangesByKey,
//             likes,
//             likeOutbox,
//             ...(config.extraReducers ?? {}), // 👈 ajoute ça
//         },
//         middleware: (getDefaultMiddleware) => {
//             const middleware = getDefaultMiddleware({
//                 thunk: {
//                     extraArgument: config.gateways,
//                 },
//                 serializableCheck: false,
//             });
//             return config.listeners
//                 ? middleware.prepend(...config.listeners)
//                 : middleware;
//         },
//         devTools: true,
//     });
// };
//
// export type ReduxStore = ReturnType<typeof initReduxStore>;
//
// export type AppThunk<ReturnType = void> = ThunkAction<
//     ReturnType,
//     AppState,
//     Gateways,
//     Action
// >;
//
// export type AppDispatch = ThunkDispatch<AppState,Gateways, Action>;
