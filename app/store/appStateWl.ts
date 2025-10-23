import {CommentsStateWl} from "@/app/contextWL/commentWl/type/commentWl.type";
import {OutboxStateWl} from "@/app/contextWL/outboxWl/type/outbox.type";
import { LikesStateWl} from "@/app/contextWL/likeWl/typeAction/likeWl.type";
import {TicketsStateWl} from "@/app/contextWL/ticketWl/typeAction/ticket.type";
import {LikeWlGateway} from "@/app/contextWL/likeWl/gateway/likeWl.gateway";
import {TicketsWlGateway} from "@/app/contextWL/ticketWl/gateway/ticketWl.gateway";
import {CommentsWlGateway} from "@/app/contextWL/commentWl/gateway/commentWl.gateway";
import {EntitlementStateWl} from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";
import {EntitlementWlGateway} from "@/app/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import {CoffeeStateWl} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {CoffeeWlGateway} from "@/app/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import {AppRuntimeState} from "@/app/contextWL/appWl/typeAction/appWl.type";

export interface AppStateWl {
    app:AppRuntimeState
    coffees:CoffeeStateWl
    comments:CommentsStateWl
    likes:LikesStateWl
    tickets:TicketsStateWl
    entitlement:EntitlementStateWl
    outbox:OutboxStateWl
}

export interface DependenciesWl {
    gateways: Partial<GatewaysWl>
    helpers: Partial<helpersType>
}

export type helpersType = {
    nowIso: () => string
    currentUserId: () => string
    getCommentIdForTests: () => string
    getCommandIdForTests: () => string
}

export type GatewaysWl = {
    coffees: CoffeeWlGateway
    comments: CommentsWlGateway
    likes: LikeWlGateway
    tickets: TicketsWlGateway
    entitlements: EntitlementWlGateway
}

