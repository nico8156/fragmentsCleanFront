import {
    CommentsStateWl, ListCommentsResult,
} from "@/app/contextWL/commentWl/type/commentWl.type";
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


//PORT
export interface CommentsWlGateway{
    list(params: {
        targetId: string;
        cursor: string;
        limit: number;
        signal: AbortSignal
    }): Promise<ListCommentsResult>;
    create({commandId, targetId, parentId, body}:{commandId: string, targetId : string, parentId?: string, body: string}):Promise<void>
    update({commandId, commentId, body, updatedAt}:{commandId: string, commentId:string, body:string, updatedAt:string}):Promise<void>
}

