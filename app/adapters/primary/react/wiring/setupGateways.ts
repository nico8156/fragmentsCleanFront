import "react-native-get-random-values";

import Constants from "expo-constants";
import { v4 as uuidv4 } from "uuid";

import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";

// ---------- Ports / types (core-logic) ----------
import type { CoffeeWlGateway } from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import type { CfPhotoGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import type { OpeningHoursGateway } from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";
import type { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import type { LikeWlGateway } from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";
import type { TicketsWlGateway } from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import type { EntitlementWlGateway } from "@/app/core-logic/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import type { LocationWlGateway } from "@/app/core-logic/contextWL/locationWl/gateway/location.gateway";
import type { ArticleWlGateway } from "@/app/core-logic/contextWL/articleWl/gateway/articleWl.gateway";

import type {
    AuthSecureStore,
    OAuthGateway,
    UserRepo,
    AuthServerGateway,
} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

import { parseToCommandId } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

import type { CommandStatusGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/commandStatus.gateway";

// ---------- Adapters (secondary) ----------
import { FakeCoffeeGateway } from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import { FakeCfPhotoWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import { FakeOpeningHoursWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";

import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";
import { StaticArticleWlGateway } from "@/app/adapters/secondary/gateways/articles/staticArticleWlGateway";

import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { googleOAuthGateway } from "@/app/adapters/secondary/gateways/auth/googleOAuthGateway";
import { authServerGateway } from "@/app/adapters/secondary/gateways/auth/authServerGateway";
import { HttpUserRepo } from "@/app/adapters/secondary/gateways/user/HttpUserRepo";
import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";

import { HttpCommentsGateway } from "@/app/adapters/secondary/gateways/comments/HttpCommentsGateway";
import { HttpLikesGateway } from "@/app/adapters/secondary/gateways/like/HttpLikesGateway";
import { HttpTicketsGateway } from "@/app/adapters/secondary/gateways/ticket/HttpTicketsGateway";
import { HttpCommandStatusGateway } from "@/app/adapters/secondary/gateways/outbox/HttpCommandStatusGateway";

import { createNativeOutboxStorage } from "@/app/adapters/secondary/gateways/outbox/nativeOutboxStorage";

// ---------- WS (primary adapter) ----------
import type { WsEventsGatewayPort } from "@/app/adapters/primary/socket/ws.gateway";
import { WsStompEventsGateway } from "@/app/adapters/primary/socket/WsEventsGateway";

// ---------- Use-cases / listeners ----------
import { ticketSubmitUseCaseFactory } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";
import { createCommentUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commentDeleteUseCaseFactory } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase";
import { commentUpdateWlUseCase } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase";
import { ackListenerFactory } from "@/app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket";

import { likeToggleUseCaseFactory } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";
import { ackLikesListenerFactory } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";

import { ackTicketsListenerFactory } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import { ackEntitlementsListener } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/ackEntitlement";

import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { outboxPersistenceMiddlewareFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/outboxPersistenceFactory";
import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";

import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";
import { authListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory";
import { wsListenerFactory } from "@/app/core-logic/contextWL/wsWl/usecases/wsListenerFactory";
import { userLocationListenerFactory } from "@/app/core-logic/contextWL/locationWl/usecases/userLocationFactory";

// ---------- Types ----------
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
    commandStatus: CommandStatusGateway;
};

// ---------- Config ----------
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
if (!API_BASE_URL) {
    throw new Error("[CONFIG] Missing expo.extra.apiBaseUrl");
}
const WS_URL = `${API_BASE_URL.replace(/^http/, "ws")}/ws`;

// ---------- Auth bridge (HTTP + WS) ----------
const authTokenBridge = new AuthTokenBridge();
const sessionRef: { current?: AuthSession } = { current: undefined };

const onSessionChanged = (session: AuthSession | undefined) => {
    authTokenBridge.setSession(session); // HTTP token source
    sessionRef.current = session;        // WS token source
};

// ---------- Gateway instances ----------
const coffees = new FakeCoffeeGateway();
const cfPhotos = new FakeCfPhotoWlGateway();
const openingHours = new FakeOpeningHoursWlGateway();

const comments = new HttpCommentsGateway({
    baseUrl: API_BASE_URL,
    getAccessToken: authTokenBridge.getAccessToken,
});

const likes = new HttpLikesGateway({
    baseUrl: API_BASE_URL,
    authToken: authTokenBridge,
});

const tickets = new HttpTicketsGateway({
    baseUrl: API_BASE_URL,
    auth: authTokenBridge,
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
    userRepo: new HttpUserRepo({
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
    commandStatus,
};

export const outboxStorage = createNativeOutboxStorage();

// ---------- Ack wiring ----------
type AckDispatcher = (action: unknown) => void;

type AckCapableGateway = {
    setAckDispatcher: (dispatch: AckDispatcher) => void;
    setCurrentUserIdGetter?: (fn: () => string) => void;
};

const isAckCapableGateway = (gw: unknown): gw is AckCapableGateway =>
    !!gw && typeof (gw as any).setAckDispatcher === "function";

const wireAck = (store: ReduxStoreWl, gw: unknown) => {
    if (!isAckCapableGateway(gw)) return;

    gw.setAckDispatcher((action) => store.dispatch(action as any));

    // priorité à session.userId (source of truth auth)
    gw.setCurrentUserIdGetter?.(() => {
        const a = store.getState().aState;
        return a?.session?.userId ?? a?.currentUser?.id ?? "anonymous";
    });
};

export const wireGatewaysForStore = (store: ReduxStoreWl) => {
    wireAck(store, gateways.likes);
    wireAck(store, gateways.comments);
    wireAck(store, gateways.tickets);
};

// ---------- Store factory ----------
export const createWlStore = (): ReduxStoreWl => {
    let storeRef: ReduxStoreWl | null = null;

    const getStore = () => {
        if (!storeRef) throw new Error("Store not ready yet");
        return storeRef;
    };

    const helpers = {
        nowIso: () => parseToISODate(new Date().toISOString()),
        currentUserId: () => {
            const a = getStore().getState().aState;
            return a?.session?.userId ?? a?.currentUser?.id ?? "anonymous";
        },
        currentUserProfile: () => {
            const u = getStore().getState().aState.currentUser;
            return u ? { displayName: u.displayName, avatarUrl: u.avatarUrl } : null;
        },
        newCommandId: () => parseToCommandId(uuidv4()),
    };

    // --- domain middlewares ---
    const commentCreateMw = createCommentUseCaseFactory({ gateways, helpers }).middleware;
    const commentDeleteMw = commentDeleteUseCaseFactory({ gateways, helpers }).middleware;
    const commentUpdateMw = commentUpdateWlUseCase({ gateways, helpers }).middleware;
    const commentAckMw = ackListenerFactory().middleware;

    const likeToggleMw = likeToggleUseCaseFactory({ gateways, helpers }).middleware;
    const likeAckMw = ackLikesListenerFactory().middleware;

    const ticketSubmitMw = ticketSubmitUseCaseFactory({ gateways, helpers });
    const ticketAckMw = ackTicketsListenerFactory();
    const entitlementAckMw = ackEntitlementsListener();

    const outboxMw = processOutboxFactory({ gateways, helpers }).middleware;

    // --- runtime ---
    const runtimeMw = runtimeListenerFactory();

    // --- persistence ---
    const outboxPersistMw = outboxPersistenceMiddlewareFactory({ storage: outboxStorage });

    const store = initReduxStoreWl({
        dependencies: { gateways, helpers },
        listeners: [
            // Comments
            commentCreateMw,
            commentDeleteMw,
            commentUpdateMw,
            commentAckMw,

            // Likes
            likeToggleMw,
            likeAckMw,

            // Outbox
            outboxMw,

            // Tickets + entitlements
            ticketSubmitMw,
            ticketAckMw,
            entitlementAckMw,

            // Runtime (app lifecycle / connectivity)
            runtimeMw,

            // Auth + WS
            authListenerFactory({
                gateways,
                helpers: {},
                onSessionChanged,
            }),
            wsListenerFactory({
                gateways,
                wsUrl: WS_URL,
                sessionRef,
            }),

            // Watchdog (ack missing)
            outboxWatchdogFactory({
                gateways,
                enableTimer: true,
                tickMs: 20_000,
            }),

            // Location
            userLocationListenerFactory({ gateways, helpers }),
        ],
        extraMiddlewares: [outboxPersistMw],
    });

    storeRef = store;
    wireGatewaysForStore(store);

    return store;
};
