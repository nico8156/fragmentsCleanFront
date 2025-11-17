import {CoffeeWlGateway} from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import {CommentsWlGateway} from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import {LikeWlGateway} from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";
import {TicketsWlGateway} from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import {EntitlementWlGateway} from "@/app/core-logic/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import {CfPhotoGateway} from "@/app/core-logic/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import {LocationWlGateway} from "@/app/core-logic/contextWL/locationWl/gateway/location.gateway";
import {ArticleWlGateway} from "@/app/core-logic/contextWL/articleWl/gateway/articleWl.gateway";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {FakeLikesGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {FakeTicketsGateway} from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import {FakeEntitlementWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import {FakeCfPhotoWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import {OpeningHoursGateway} from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";
import {FakeOpeningHoursWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";
import {ExpoLocationGateway} from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";
import {StaticArticleWlGateway} from "@/app/adapters/secondary/gateways/articles/staticArticleWlGateway";
import {
    AuthSecureStore,
    OAuthGateway,
    UserRepo,
    AuthServerGateway,
} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {DemoOAuthGateway} from "@/app/adapters/secondary/gateways/auth/demoOAuthGateway";
import {ExpoSecureAuthSessionStore} from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import {DemoUserRepo} from "@/app/adapters/secondary/gateways/auth/demoUserRepo";
import {SyncEventsGateway} from "@/app/core-logic/contextWL/outboxWl/gateway/eventsGateway";
import {FakeEventsGateway} from "@/app/adapters/secondary/gateways/fake/fakeEventsGateway";
import { createNativeOutboxStorage } from "@/app/adapters/secondary/gateways/outbox/nativeOutboxStorage";
import {ReduxStoreWl} from "@/app/store/reduxStoreWl";

export type GatewaysWl = {
    coffees: CoffeeWlGateway
    cfPhotos: CfPhotoGateway
    openingHours: OpeningHoursGateway
    comments: CommentsWlGateway
    likes: LikeWlGateway
    tickets: TicketsWlGateway
    entitlements: EntitlementWlGateway
    locations: LocationWlGateway
    articles: ArticleWlGateway
    events: SyncEventsGateway
    auth: {
        oauth: OAuthGateway
        secureStore: AuthSecureStore
        userRepo: UserRepo
        server?: AuthServerGateway
    }
}
// toujours dans gatewaysConfiguration.ts

export const wireGatewaysForStore = (store: ReduxStoreWl) => {
    // currentUserId getter pour les likes
    const likeGateway = gateways.likes as FakeLikesGateway;
    if (likeGateway.setCurrentUserIdGetter) {
        likeGateway.setCurrentUserIdGetter(
            () => store.getState().aState.currentUser?.id ?? "anonymous",
        );
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
};


const coffees = new FakeCoffeeGateway()
const cfPhotos = new FakeCfPhotoWlGateway()
const openingHours = new FakeOpeningHoursWlGateway()
const comments = new FakeCommentsWlGateway()
const likes = new FakeLikesGateway()
const tickets = new FakeTicketsGateway()
const entitlements = new FakeEntitlementWlGateway()
const locations = new ExpoLocationGateway()
const articles = new StaticArticleWlGateway()
const events = new FakeEventsGateway()
export const outboxStorage = createNativeOutboxStorage()
const auth = {
    oauth: new DemoOAuthGateway(),
    secureStore: new ExpoSecureAuthSessionStore(),
    userRepo: new DemoUserRepo(),
} as const


export const gateways: GatewaysWl = {
    coffees,cfPhotos,openingHours, comments,likes,tickets,entitlements, locations, articles, events, auth
};
