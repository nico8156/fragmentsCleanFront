// /app/adapters/primary/react/wiring/setupGateways.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import 'react-native-get-random-values';

import { CoffeeWlGateway } from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import { LikeWlGateway } from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";
import { TicketsWlGateway } from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import { EntitlementWlGateway } from "@/app/core-logic/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import { CfPhotoGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import { LocationWlGateway } from "@/app/core-logic/contextWL/locationWl/gateway/location.gateway";
import { ArticleWlGateway } from "@/app/core-logic/contextWL/articleWl/gateway/articleWl.gateway";
import { OpeningHoursGateway } from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";

import {
    AuthSecureStore,
    OAuthGateway,
    UserRepo,
    AuthServerGateway,
} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";

import { FakeCoffeeGateway } from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import { FakeCfPhotoWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import { FakeOpeningHoursWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";

import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";
import { StaticArticleWlGateway } from "@/app/adapters/secondary/gateways/articles/staticArticleWlGateway";

import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { SyncEventsGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import { createNativeOutboxStorage } from "@/app/adapters/secondary/gateways/outbox/nativeOutboxStorage";
import { createNativeSyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";

import { ticketSubmitUseCaseFactory } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";
import { createCommentUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { ackListenerFactory } from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";
import { likeToggleUseCaseFactory } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";
import { ackLikesListenerFactory } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";
import { ackTicketsListenerFactory } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import { ackEntitlementsListener } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/ackEntitlement";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";

import { authListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory";
import { userLocationListenerFactory } from "@/app/core-logic/contextWL/locationWl/usecases/userLocationFactory";

import { syncRuntimeListenerFactory } from "@/app/core-logic/contextWL/outboxWl/sync/syncRuntimeListenerFactory";
import { outboxPersistenceMiddlewareFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/outboxPersistenceFactory";
import { commentDeleteUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";
import { commentUpdateWlUseCase } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import { syncEventsListenerFactory } from "@/app/core-logic/contextWL/outboxWl/sync/syncEventsListenerFactory";
import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";

import { googleOAuthGateway } from "@/app/adapters/secondary/gateways/auth/googleOAuthGateway";
import { authServerGateway } from "@/app/adapters/secondary/gateways/auth/authServerGateway";
import { HttpLikesGateway } from "@/app/adapters/secondary/gateways/like/HttpLikesGateway";
import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

import Constants from "expo-constants";
import { NoopEventsGateway } from "@/app/adapters/secondary/gateways/NoopEventsGateway";

import { WsEventsGatewayPort } from "@/app/adapters/primary/socket/ws.gateway";
import { WsStompEventsGateway } from "@/app/adapters/primary/socket/WsEventsGateway";

// ✅ AJOUT : WS listener global
import { wsListenerFactory } from "@/app/core-logic/contextWL/wsWl/usecases/wsListenerFactory";
import {HttpCommentsGateway} from "@/app/adapters/secondary/gateways/comments/HttpCommentsGateway";
import {HttpUserRepo} from "@/app/adapters/secondary/gateways/user/HttpUserRepo";
import {parseToCommandId} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { v4 as uuidv4 } from "uuid";
import {parseToISODate} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {HttpTicketsGateway} from "@/app/adapters/secondary/gateways/ticket/HttpTicketsGateway";
import {CommandStatusGateway} from "@/app/core-logic/contextWL/outboxWl/gateway/commandStatus.gateway";
import {HttpCommandStatusGateway} from "@/app/adapters/secondary/gateways/outbox/HttpCommandStatusGateway";
import {outboxWatchdogFactory} from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";

// ---- types ----
export type GatewaysWl = {
    coffees: CoffeeWlGateway;
    cfPhotos: CfPhotoGateway;
    openingHours: OpeningHoursGateway;
    comments: CommentsWlGateway;
    likes: LikeWlGateway;
    tickets: TicketsWlGateway;
    entitlements: EntitlementWlGateway;
    locations: LocationWlGateway;
    articles: ArticleWlGateway;
    auth: {
        oauth: OAuthGateway;
        secureStore: AuthSecureStore;
        userRepo: UserRepo;
        server?: AuthServerGateway;
    };
    ws: WsEventsGatewayPort;
    authToken: AuthTokenBridge;
    commandStatus: CommandStatusGateway
};

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string;

// ---- instantiation des gateways ----
const authTokenBridge = new AuthTokenBridge();

// ✅ AJOUT : sessionRef + callback unique (HTTP + WS)
const sessionRef: { current?: AuthSession } = { current: undefined };

const onSessionChanged = (session: AuthSession | undefined) => {
    console.log("[AUTH] onSessionChanged", {
        hasSession: !!session,
        hasToken: !!session?.tokens?.accessToken,
        userId: session?.userId,
    });
    authTokenBridge.setSession(session); // HTTP
    sessionRef.current = session;        // WS
};

const coffees = new FakeCoffeeGateway();
const cfPhotos = new FakeCfPhotoWlGateway();
const openingHours = new FakeOpeningHoursWlGateway();

const comments = new HttpCommentsGateway({
    baseUrl: API_BASE_URL,
    getAccessToken: authTokenBridge.getAccessToken,
});

const likes = new HttpLikesGateway({
    baseUrl: API_BASE_URL,
    authToken: authTokenBridge
});

const tickets = new HttpTicketsGateway({
    baseUrl:API_BASE_URL,
    auth: authTokenBridge
});

const commandStatus = new HttpCommandStatusGateway({
    baseUrl: API_BASE_URL,
    authToken: authTokenBridge,
});

const entitlements = new FakeEntitlementWlGateway();
const locations = new ExpoLocationGateway();
const articles = new StaticArticleWlGateway();

const ws = new WsStompEventsGateway();

const auth = {
    oauth: googleOAuthGateway,
    secureStore: new ExpoSecureAuthSessionStore(),
    userRepo: new HttpUserRepo(
        {
            baseUrl: API_BASE_URL,
            getAccessToken: authTokenBridge.getAccessToken,
        }),
    server: authServerGateway,
} as const;

export const gateways: GatewaysWl = {
    coffees,
    cfPhotos,
    openingHours,
    comments,
    likes,
    tickets,
    entitlements,
    locations,
    articles,
    auth,
    ws,
    authToken: authTokenBridge,
    commandStatus
};

export const outboxStorage = createNativeOutboxStorage();
export const syncMetaStorage = createNativeSyncMetaStorage();

type AckDispatcher = (action: any) => void;

type AckCapableGateway = {
    setAckDispatcher: (dispatch: AckDispatcher) => void;
    setCurrentUserIdGetter?: (fn: () => string) => void;
};

const isAckCapableGateway = (gw: any): gw is AckCapableGateway => {
    return gw && typeof gw.setAckDispatcher === "function";
};

const wireAck = (store: ReduxStoreWl, gw: unknown) => {
    if (!isAckCapableGateway(gw)) return;
    gw.setAckDispatcher((action) => store.dispatch(action));
    gw.setCurrentUserIdGetter?.(() => store.getState().aState.currentUser?.id ?? "anonymous");
};


// ---- wiring spécifique store <-> gateways ----
export const wireGatewaysForStore = (store: ReduxStoreWl) => {
    console.log("[STORE] wireGatewaysForStore: start");

    wireAck(store, gateways.likes);
    wireAck(store, gateways.comments);
    wireAck(store, gateways.tickets);

    console.log("[STORE] wireGatewaysForStore: done");
};

// ---- création du store + middlewares/metier/runtime/sync ----
export const createWlStore = (): ReduxStoreWl => {
    console.log("[STORE] createWlStore: start");

    let storeRef: ReduxStoreWl | null = null;
    const getStore = () => {
        if (!storeRef) throw new Error("Store not ready yet");
        return storeRef;
    };

    const helpers = {
        nowIso: () => parseToISODate(new Date().toISOString()),
        currentUserId: () => {
            const a = storeRef?.getState().aState;
            return a?.session?.userId ?? a?.currentUser?.id ?? "anonymous";
        },
        currentUserProfile: () => {
            const u = getStore().getState().aState.currentUser;
            return u ? { displayName: u.displayName, avatarUrl: u.avatarUrl } : null;
        },
        newCommandId: () => parseToCommandId(uuidv4()),
    };


    const ticketSubmitMiddleware = ticketSubmitUseCaseFactory({ gateways, helpers });
    const commentCreateMiddleware = createCommentUseCaseFactory({ gateways, helpers }).middleware;
    const commentDeleteMiddleware = commentDeleteUseCaseFactory({ gateways, helpers }).middleware;
    const commentUpdateMiddleware = commentUpdateWlUseCase({ gateways, helpers }).middleware;
    const commentAckMiddleware = ackListenerFactory().middleware;

    const likeToggleMiddleware = likeToggleUseCaseFactory({ gateways, helpers }).middleware;
    const likeAckMiddleware = ackLikesListenerFactory().middleware;

    const ticketAckMiddleware = ackTicketsListenerFactory();
    const entitlementAckMiddleware = ackEntitlementsListener();

    const outboxMiddleware = processOutboxFactory({ gateways, helpers }).middleware;

    // const syncRuntimeListener = syncRuntimeListenerFactory({
    //     eventsGateway: gateways.events,
    //     metaStorage: syncMetaStorage,
    // });

    const runtimeListener = runtimeListenerFactory();

    const outboxPersistenceMiddleware = outboxPersistenceMiddlewareFactory({ storage: outboxStorage });

    // ✅ WS URL (endpoint backend "/ws")
    const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/ws`;

    console.log("[STORE] createWlStore: create middlewares");

    const store = initReduxStoreWl({
        dependencies: { gateways, helpers },
        listeners: [
            //Comments
            commentCreateMiddleware,
            commentDeleteMiddleware,
            commentUpdateMiddleware,
            commentAckMiddleware,
            //Likes
            likeToggleMiddleware,
            likeAckMiddleware,

            outboxMiddleware,

            ticketSubmitMiddleware,
            ticketAckMiddleware,
            entitlementAckMiddleware,

            // syncRuntimeListener,
            runtimeListener,

            authListenerFactory({
                gateways,
                helpers: {},
                onSessionChanged, // ✅ callback unique
            }),
            wsListenerFactory({
                gateways,
                wsUrl,
                sessionRef,
            }),
            outboxWatchdogFactory({
                gateways,
                enableTimer: true,
                tickMs: 20_000,
            }),

            userLocationListenerFactory({ gateways, helpers }),
        ],
        extraMiddlewares: [outboxPersistenceMiddleware],
    });

    storeRef = store;

    console.log("[STORE] createWlStore: initReduxStoreWl done");
    console.log("[STORE] createWlStore: wireGatewaysForStore");

    wireGatewaysForStore(store);

    console.log("[STORE] createWlStore: done");
    return store;
};
