import {CommentRoot, CommentId, CommentStatus, Comment} from "@/app/contexts/comment/comment.type";
import {CommentsState} from "@/app/store/appState";

export interface CommentWLGateaway {
    createComment(params: {
        postId: string;
        body: string;
        commandId: string;
        draftId?: string;
    }): Promise<{ comment: Omit<Comment, "_local" | "tempId"> }>; // renvoie DTO serveur

    editComment(params: {
        id: CommentId;
        body: string;
        commandId: string;
    }): Promise<{ comment: Omit<Comment, "_local" | "tempId"> }>;

    deleteComment(params: {
        id: CommentId;
        commandId: string;
    }): Promise<{ id: CommentId; status: CommentStatus; updatedAt: string }>;

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
    selectCurrentUserId: (state: CommentsState) => string;
}