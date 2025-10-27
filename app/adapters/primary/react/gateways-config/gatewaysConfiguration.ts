import {CoffeeWlGateway} from "@/app/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import {CommentsWlGateway} from "@/app/contextWL/commentWl/gateway/commentWl.gateway";
import {LikeWlGateway} from "@/app/contextWL/likeWl/gateway/likeWl.gateway";
import {TicketsWlGateway} from "@/app/contextWL/ticketWl/gateway/ticketWl.gateway";
import {EntitlementWlGateway} from "@/app/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import {FakeLikesGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {FakeTicketsGateway} from "@/app/adapters/secondary/gateways/fake/fakeTicketWlGateway";
import {FakeEntitlementWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import {LocationWlGateway} from "@/app/contextWL/locationWl/gateway/location.gateway";
import {PhoneLocationProvider} from "@/app/adapters/secondary/gateways/fake/phoneLocationProvider";
import {FakeLocationWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeLocationWlGateway";

export type GatewaysWl = {
    coffees: CoffeeWlGateway
    comments: CommentsWlGateway
    likes: LikeWlGateway
    tickets: TicketsWlGateway
    entitlements: EntitlementWlGateway
    locations: LocationWlGateway
}

const coffees = new FakeCoffeeGateway()
const comments = new FakeCommentsWlGateway()
const likes = new FakeLikesGateway()
const tickets = new FakeTicketsGateway()
const entitlements = new FakeEntitlementWlGateway()
const locations = new FakeLocationWlGateway(
    new PhoneLocationProvider
)


export const gateways: GatewaysWl = {
    coffees, comments,likes,tickets,entitlements, locations
};
