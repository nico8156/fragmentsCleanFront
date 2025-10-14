import {
    CafeId,
    CommentEntity,
    CommentsStateWl, ISODate,
    ListCommentsParams, Op,
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

export interface CommentsWlGateway{
    list(params: {
        targetId: string;
        cursor: string;
        limit: number;
        signal: AbortSignal
    }): Promise<{
        targetId: CafeId;
        op: Op;
        items: CommentEntity[];
        nextCursor?: string;
        prevCursor?: string;
        serverTime?: ISODate
    }>;
    create({commandId, targetId, parentId, body}:{commandId: string, targetId : string, parentId?: string, body: string}):Promise<void>
}

