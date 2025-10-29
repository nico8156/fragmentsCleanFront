import {CoffeeWlGateway} from "@/app/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import {CommentsWlGateway} from "@/app/contextWL/commentWl/gateway/commentWl.gateway";
import {LikeWlGateway} from "@/app/contextWL/likeWl/gateway/likeWl.gateway";
import {TicketsWlGateway} from "@/app/contextWL/ticketWl/gateway/ticketWl.gateway";
import {EntitlementWlGateway} from "@/app/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import {CfPhotoGateway} from "@/app/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import {LocationWlGateway} from "@/app/contextWL/locationWl/gateway/location.gateway";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {FakeLikesGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {FakeTicketsGateway} from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import {FakeEntitlementWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import {FakeCfPhotoWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import {OpeningHoursGateway} from "@/app/contextWL/openingHoursWl/gateway/openingHours.gateway";
import {FakeOpeningHoursWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";
import {ExpoLocationGateway} from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";

export type GatewaysWl = {
    coffees: CoffeeWlGateway
    cfPhotos: CfPhotoGateway
    openingHours: OpeningHoursGateway
    comments: CommentsWlGateway
    likes: LikeWlGateway
    tickets: TicketsWlGateway
    entitlements: EntitlementWlGateway
    locations: LocationWlGateway
}

const coffees = new FakeCoffeeGateway()
const cfPhotos = new FakeCfPhotoWlGateway()
const openingHours = new FakeOpeningHoursWlGateway()
const comments = new FakeCommentsWlGateway()
const likes = new FakeLikesGateway()
const tickets = new FakeTicketsGateway()
const entitlements = new FakeEntitlementWlGateway()
const locations = new ExpoLocationGateway()


export const gateways: GatewaysWl = {
    coffees,cfPhotos,openingHours, comments,likes,tickets,entitlements, locations
};
