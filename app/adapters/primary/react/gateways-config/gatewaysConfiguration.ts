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

export type GatewaysWl = {
    coffees: CoffeeWlGateway
    comments: CommentsWlGateway
    likes: LikeWlGateway
    tickets: TicketsWlGateway
    entitlements: EntitlementWlGateway
}

const coffees = new FakeCoffeeGateway()
const comments = new FakeCommentsWlGateway()
const likes = new FakeLikesGateway()
const tickets = new FakeTicketsGateway()
const entitlements = new FakeEntitlementWlGateway()

export const gateways: GatewaysWl = {
    coffees, comments,likes,tickets,entitlements
};
