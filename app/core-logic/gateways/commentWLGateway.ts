import {CommentId, CommentsStateWl} from "@/app/contextWL/commentWl/type/commentWl.type";
import {StatusType} from "@/app/contextWL/outboxWl/type/outbox.type";

export interface CommentWLGateaway {
    createComment(params: {
        postId: string;
        body: string;
        commandId: string;
        draftId?: string;
    }): Promise<void>; // renvoie DTO serveur

    editComment(params: {
        id: CommentId;
        body: string;
        commandId: string;
    }): Promise<{ comment: Omit<Comment, "_local" | "tempId"> }>;

    deleteComment(params: {
        id: CommentId;
        commandId: string;
    }): Promise<{ id: CommentId; status: StatusType; updatedAt: string }>;

    retrieveForPost(params: {
        postId: string;
        cursor?: string;
        since?: string;
        limit?: number;
    }): Promise<{ items: Omit<Comment, "_local" | "tempId">[]; nextCursor?: string; serverTime: string }>;
}

export interface Clock { nowISO(): string }
export interface IdGen { newId(): string }


export interface Deps {
    api: CommentWLGateaway;
    clock: Clock;
    ids: IdGen;
    selectCurrentUserId: (state: CommentsStateWl) => string;
}