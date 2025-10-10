import {CommentsStateWl} from "@/app/contextWL/commentWl/commentWl.type";
import {OutboxStateWl} from "@/app/contextWL/outboxWl/outbox.type";

export interface AppStateWl {
    comments:CommentsStateWl;
    outbox:OutboxStateWl
}

export interface DependenciesWl {
    gateways: Partial<GatewaysWl>;
    helpers: Partial<helpersType>
}

export type helpersType = {
    nowIso: () => string;
    currentUserId: () => string;
    getCommentIdForTests: () => string;
    getCommandIdForTests: () => string;
}

export type GatewaysWl = {
    comments: CommentsWlGateway;
}

export interface CommentsWlGateway{
    create({commandId, targetId, parentId, body}:{commandId: string, targetId : string, parentId?: string, body: string}):Promise<void>
}

