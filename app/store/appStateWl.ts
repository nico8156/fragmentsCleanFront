import {CommentsStateWl} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import {CommandId, OutboxStateWl} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { LikesStateWl} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import {TicketsStateWl} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {EntitlementStateWl} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";
import {CoffeeStateWl} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {AppRuntimeState} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.type";

import {CfPhotoStateWl} from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.type";
import {ohStateWl} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";
import {LocationStateWl} from "@/app/core-logic/contextWL/locationWl/typeAction/location.type";
import {ArticleStateWl} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import {AuthState} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {GatewaysWl} from "@/app/adapters/primary/react/wiring/setupGateways";
import {ISODate} from "@/assets/data/comment";


export interface AppStateWl {
    app:AppRuntimeState
    coffees:CoffeeStateWl
    cfPhotos: CfPhotoStateWl
    openingHours: ohStateWl
    comments:CommentsStateWl
    likes:LikesStateWl
    tickets:TicketsStateWl
    entitlement:EntitlementStateWl
    oState:OutboxStateWl
    location:LocationStateWl
    articles: ArticleStateWl
    authState: AuthState
}

export type HelpersCore = {
    nowIso: () => string;
    currentUserId: () => string;
    currentUserProfile: () => { displayName?: string; avatarUrl?: string } | null;
    newCommandId: () => CommandId;
};

export type HelpersTest = {
    getCommentIdForTests?: () => string;
    getCommandIdForTests?: () => string;
    newTicketIdForTests?: () => ISODate;
};

export type Helpers = HelpersCore & HelpersTest;

export interface DependenciesWl {
    gateways: Partial<GatewaysWl>;
    helpers: Helpers;
}