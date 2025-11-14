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
import {SyncEventsGateway} from "@/app/core-logic/contextWL/outboxWl/runtime/eventsGateway";
import {FakeEventsGateway} from "@/app/adapters/secondary/gateways/fake/fakeEventsGateway";

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
const auth = {
    oauth: new DemoOAuthGateway(),
    secureStore: new ExpoSecureAuthSessionStore(),
    userRepo: new DemoUserRepo(),
} as const


export const gateways: GatewaysWl = {
    coffees,cfPhotos,openingHours, comments,likes,tickets,entitlements, locations, articles, events, auth
};
