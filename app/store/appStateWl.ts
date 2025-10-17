import {
    CommentsStateWl, ListCommentsResult,
} from "@/app/contextWL/commentWl/type/commentWl.type";
import {OutboxStateWl} from "@/app/contextWL/outboxWl/outbox.type";
import { LikesStateWl} from "@/app/contextWL/likeWl/typeAction/likeWl.type";

export interface AppStateWl {
    comments:CommentsStateWl;
    likes:LikesStateWl;
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
    likes: LikeWlGateway
}
//PORT === LIKE
export interface LikeWlGateway{
    get({ targetId, signal}:{ targetId:string, signal:AbortSignal}):Promise<{ count: number; me: boolean; version: number; serverTime?: string}>
    add({commandId, targetId, userId, at}:{commandId: string, targetId: string, userId: string, at: string}):Promise<void>
    remove({commandId, targetId, userId, at}:{commandId: string, targetId: string, userId: string, at: string}):Promise<void>
}
//PORT === COMMENT
export interface CommentsWlGateway{
    list(params: {
        targetId: string;
        cursor: string;
        limit: number;
        signal: AbortSignal
    }): Promise<ListCommentsResult>;
    create({commandId, targetId, parentId, body}:{commandId: string, targetId : string, parentId?: string, body: string}):Promise<void>
    update({commandId, commentId, body, updatedAt}:{commandId: string, commentId:string, body:string, updatedAt:string}):Promise<void>
    delete({commandId, commentId, deletedAt}:{commandId: string, commentId:string, deletedAt: string}):Promise<void>
}

