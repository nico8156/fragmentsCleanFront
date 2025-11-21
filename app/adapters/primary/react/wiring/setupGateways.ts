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
import { FakeLikesGateway } from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import { FakeTicketsGateway } from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import { FakeCfPhotoWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import { FakeOpeningHoursWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";

import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";
import { StaticArticleWlGateway } from "@/app/adapters/secondary/gateways/articles/staticArticleWlGateway";

import { DemoOAuthGateway } from "@/app/adapters/secondary/gateways/auth/demoOAuthGateway";
import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { DemoUserRepo } from "@/app/adapters/secondary/gateways/auth/demoUserRepo";

import { SyncEventsGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import { FakeEventsGateway } from "@/app/adapters/secondary/gateways/fake/fakeEventsGateway";

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
import {commentDeleteUseCaseFactory} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";
import {commentUpdateWlUseCase} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import {syncEventsListenerFactory} from "@/app/core-logic/contextWL/outboxWl/sync/syncEventsListenerFactory";

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
};

// ---- instantiation des gateways ----

const coffees = new FakeCoffeeGateway();
const cfPhotos = new FakeCfPhotoWlGateway();
const openingHours = new FakeOpeningHoursWlGateway();
const comments = new FakeCommentsWlGateway();
const likes = new FakeLikesGateway();
const tickets = new FakeTicketsGateway();
const entitlements = new FakeEntitlementWlGateway();
const locations = new ExpoLocationGateway();
const articles = new StaticArticleWlGateway();
const events = new FakeEventsGateway();

const auth = {
    oauth: new DemoOAuthGateway(),
    secureStore: new ExpoSecureAuthSessionStore(),
    userRepo: new DemoUserRepo(),
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
};

export const outboxStorage = createNativeOutboxStorage();

export const syncMetaStorage = createNativeSyncMetaStorage();


// ---- wiring spécifique store <-> gateways ----

export const wireGatewaysForStore = (store: ReduxStoreWl) => {
    console.log("[STORE] wireGatewaysForStore: start");
    // currentUserId getter pour les likes
    const likeGateway = gateways.likes as FakeLikesGateway;
    if ("setAckDispatcher" in likeGateway) {
        likeGateway.setAckDispatcher((action) => {
            store.dispatch(action);
        });
        if (likeGateway.setCurrentUserIdGetter) {
            likeGateway.setCurrentUserIdGetter(
                () => store.getState().aState.currentUser?.id ?? "anonymous",
            );
        }
    }


    // ACK dispatcher pour les comments
    const commentsGateway = gateways.comments as FakeCommentsWlGateway;
    if ("setAckDispatcher" in commentsGateway) {
        commentsGateway.setAckDispatcher((action) => {
            store.dispatch(action);
        });
        if (commentsGateway.setCurrentUserIdGetter) {
            commentsGateway.setCurrentUserIdGetter(
                () => store.getState().aState.currentUser?.id ?? "anonymous",
            );
        }
    }

    // ACK dispatcher pour les tickets
    const ticketsGateway = gateways.tickets as FakeTicketsGateway;
    if ("setAckDispatcher" in ticketsGateway) {
        ticketsGateway.setAckDispatcher((action) => {
            store.dispatch(action);
        });
        ticketsGateway.setCurrentUserIdGetter(
            () => store.getState().aState.currentUser?.id ?? "anonymous",
        );
    }
    console.log("[STORE] wireGatewaysForStore: done");


    // si un jour tu as des ACK pour events, tu les cableras aussi ici
};

// ---- création du store + middlewares/metier/runtime/sync ----

export const createWlStore = (): ReduxStoreWl => {
    console.log("[STORE] createWlStore: start");
    let storeRef: ReduxStoreWl | null = null;

    const helpers = {
        nowIso: () => new Date().toISOString() as any,
        currentUserId: () =>
            storeRef?.getState().aState.currentUser?.id ?? "anonymous",
    };

    const ticketSubmitMiddleware = ticketSubmitUseCaseFactory({ gateways, helpers });
    const commentCreateMiddleware = createCommentUseCaseFactory({
        gateways,
        helpers,
    }).middleware;
    const commentDeleteMiddleware = commentDeleteUseCaseFactory({
        gateways,
        helpers,
    }).middleware;
    const commentUpdateMiddleware = commentUpdateWlUseCase({
        gateways,
        helpers,
    }).middleware;
    const commentAckMiddleware = ackListenerFactory({
        gateways,
        helpers,
    }).middleware;
    const likeToggleMiddleware = likeToggleUseCaseFactory({
        gateways,
        helpers,
    }).middleware;
    const likeAckMiddleware = ackLikesListenerFactory().middleware;
    const ticketAckMiddleware = ackTicketsListenerFactory();
    const entitlementAckMiddleware = ackEntitlementsListener();
    const outboxMiddleware = processOutboxFactory({
        gateways,
        helpers,
    }).middleware;

    const syncRuntimeListener = syncRuntimeListenerFactory({
        eventsGateway: gateways.events,
        metaStorage: syncMetaStorage
    });

    const syncEventsListener = syncEventsListenerFactory({
        metaStorage: syncMetaStorage,
    })

    const outboxPersistenceMiddleware = outboxPersistenceMiddlewareFactory({
        storage: outboxStorage,
    });
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
            authListenerFactory({ gateways, helpers: {} }),
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
