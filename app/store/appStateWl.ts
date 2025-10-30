import {CommentsStateWl} from "@/app/contextWL/commentWl/type/commentWl.type";
import {OutboxStateWl} from "@/app/contextWL/outboxWl/type/outbox.type";
import { LikesStateWl} from "@/app/contextWL/likeWl/typeAction/likeWl.type";
import {TicketsStateWl} from "@/app/contextWL/ticketWl/typeAction/ticket.type";
import {EntitlementStateWl} from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";
import {CoffeeStateWl, GeoPoint} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {AppRuntimeState} from "@/app/contextWL/appWl/typeAction/appWl.type";
import {GatewaysWl} from "@/app/adapters/primary/react/gateways-config/gatewaysConfiguration";
import {CfPhotoStateWl} from "@/app/contextWL/cfPhotosWl/typeAction/cfPhoto.type";
import {ohStateWl} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.type";
import {LocationStateWl} from "@/app/contextWL/locationWl/typeAction/location.type";
import {ArticleStateWl} from "@/app/contextWL/articleWl/typeAction/article.type";


export interface AppStateWl {
    app:AppRuntimeState
    coffees:CoffeeStateWl
    cfPhotos: CfPhotoStateWl
    openingHours: ohStateWl
    comments:CommentsStateWl
    likes:LikesStateWl
    tickets:TicketsStateWl
    entitlement:EntitlementStateWl
    outbox:OutboxStateWl
    location:LocationStateWl
    articles: ArticleStateWl
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


