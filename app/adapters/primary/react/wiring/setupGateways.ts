// /app/adapters/primary/react/wiring/setupGateways.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";

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

import { FakeCommentsWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import { FakeCoffeeGateway } from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import { FakeTicketsGateway } from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import { FakeCfPhotoWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import { FakeOpeningHoursWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";

import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";
import { StaticArticleWlGateway } from "@/app/adapters/secondary/gateways/articles/staticArticleWlGateway";

import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { DemoUserRepo } from "@/app/adapters/secondary/gateways/auth/demoUserRepo";

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

import { WsEventsGatewayPort } from "@/app/adapters/primary/gateways-config/socket/ws.gateway";
import { WsStompEventsGateway } from "@/app/adapters/primary/gateways-config/socket/WsEventsGateway";

// ✅ AJOUT : WS listener global
import { wsListenerFactory } from "@/app/core-logic/contextWL/wsWl/usecases/wsListenerFactory";

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
    events: SyncEventsGateway;
    auth: {
        oauth: OAuthGateway;
        secureStore: AuthSecureStore;
        userRepo: UserRepo;
        server?: AuthServerGateway;
    };
    ws: WsEventsGatewayPort;
};

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string;

// ---- instantiation des gateways ----
const authTokenBridge = new AuthTokenBridge();

// ✅ AJOUT : sessionRef + callback unique (HTTP + WS)
const sessionRef: { current?: AuthSession } = { current: undefined };

const onSessionChanged = (session: AuthSession | undefined) => {
    authTokenBridge.setSession(session); // HTTP
    sessionRef.current = session;        // WS
};

const coffees = new FakeCoffeeGateway();
const cfPhotos = new FakeCfPhotoWlGateway();
const openingHours = new FakeOpeningHoursWlGateway();
const comments = new FakeCommentsWlGateway();

const likes = new HttpLikesGateway({
    baseUrl: API_BASE_URL,
    getAccessToken: authTokenBridge.getAccessToken,
});

const tickets = new FakeTicketsGateway();
const entitlements = new FakeEntitlementWlGateway();
const locations = new ExpoLocationGateway();
const articles = new StaticArticleWlGateway();
const events = new NoopEventsGateway();
const ws = new WsStompEventsGateway();

const auth = {
    oauth: googleOAuthGateway,
    secureStore: new ExpoSecureAuthSessionStore(),
    userRepo: new DemoUserRepo(),
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
    events,
    auth,
    ws,
};

export const outboxStorage = createNativeOutboxStorage();
export const syncMetaStorage = createNativeSyncMetaStorage();

type AckCapableLikesGateway = {
    setAckDispatcher: (action: any) => void;
    setCurrentUserIdGetter?: (fn: () => string) => void;
};

const isAckCapableLikesGateway = (g: any): g is AckCapableLikesGateway => {
    return g && typeof g.setAckDispatcher === "function";
};

// ---- wiring spécifique store <-> gateways ----
export const wireGatewaysForStore = (store: ReduxStoreWl) => {
    console.log("[STORE] wireGatewaysForStore: start");

    const likeGateway = gateways.likes;
    if (isAckCapableLikesGateway(likeGateway)) {
        likeGateway.setAckDispatcher((action: any) => {
            store.dispatch(action);
        });

        likeGateway.setCurrentUserIdGetter?.(() => store.getState().aState.currentUser?.id ?? "anonymous");

        console.log("[STORE] wireGatewaysForStore: ACK wiring enabled for FakeLikesGateway");
    } else {
        console.log("[STORE] wireGatewaysForStore: no ACK wiring for likes gateway (probably HttpLikesGateway)");
    }

    const commentsGateway = gateways.comments as FakeCommentsWlGateway;
    if ("setAckDispatcher" in commentsGateway) {
        commentsGateway.setAckDispatcher((action) => {
            store.dispatch(action);
        });
        if (commentsGateway.setCurrentUserIdGetter) {
            commentsGateway.setCurrentUserIdGetter(() => store.getState().aState.currentUser?.id ?? "anonymous");
        }
    }

    const ticketsGateway = gateways.tickets as FakeTicketsGateway;
    if ("setAckDispatcher" in ticketsGateway) {
        ticketsGateway.setAckDispatcher((action) => {
            store.dispatch(action);
        });
        ticketsGateway.setCurrentUserIdGetter(() => store.getState().aState.currentUser?.id ?? "anonymous");
    }

    console.log("[STORE] wireGatewaysForStore: done");
};

// ---- création du store + middlewares/metier/runtime/sync ----
export const createWlStore = (): ReduxStoreWl => {
    console.log("[STORE] createWlStore: start");
    let storeRef: ReduxStoreWl | null = null;

    const helpers = {
        nowIso: () => new Date().toISOString() as any,
        currentUserId: () => storeRef?.getState().aState.currentUser?.id ?? "anonymous",
    };

    const ticketSubmitMiddleware = ticketSubmitUseCaseFactory({ gateways, helpers });
    const commentCreateMiddleware = createCommentUseCaseFactory({ gateways, helpers }).middleware;
    const commentDeleteMiddleware = commentDeleteUseCaseFactory({ gateways, helpers }).middleware;
    const commentUpdateMiddleware = commentUpdateWlUseCase({ gateways, helpers }).middleware;
    const commentAckMiddleware = ackListenerFactory({ gateways, helpers }).middleware;

    const likeToggleMiddleware = likeToggleUseCaseFactory({ gateways, helpers }).middleware;
    const likeAckMiddleware = ackLikesListenerFactory().middleware;

    const ticketAckMiddleware = ackTicketsListenerFactory();
    const entitlementAckMiddleware = ackEntitlementsListener();

    const outboxMiddleware = processOutboxFactory({ gateways, helpers }).middleware;

    const syncRuntimeListener = syncRuntimeListenerFactory({
        eventsGateway: gateways.events,
        metaStorage: syncMetaStorage,
    });

    const runtimeListener = runtimeListenerFactory();

    const syncEventsListener = syncEventsListenerFactory({ metaStorage: syncMetaStorage });

    const outboxPersistenceMiddleware = outboxPersistenceMiddlewareFactory({ storage: outboxStorage });

    // ✅ WS URL (endpoint backend "/ws")
    const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/ws`;

    console.log("[STORE] createWlStore: create middlewares");

    const store = initReduxStoreWl({
        dependencies: { gateways, helpers },
        listeners: [
            commentCreateMiddleware,
            commentDeleteMiddleware,
            commentUpdateMiddleware,
            commentAckMiddleware,

            likeToggleMiddleware,
            likeAckMiddleware,

            outboxMiddleware,

            ticketSubmitMiddleware,
            ticketAckMiddleware,
            entitlementAckMiddleware,

            syncRuntimeListener,
            syncEventsListener,
            runtimeListener,

            authListenerFactory({
                gateways,
                helpers: {},
                onSessionChanged, // ✅ callback unique
            }),

            // ✅ WS listener global (routing inbound + connect/disconnect via token)
            wsListenerFactory({
                gateways,
                wsUrl,
                sessionRef,
            }),

            userLocationListenerFactory({ gateways, helpers: {} }),
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
