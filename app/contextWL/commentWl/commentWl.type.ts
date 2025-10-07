import {EntityState} from "@reduxjs/toolkit";

export type CommentEntity = {
    id: string; targetId: string; parentId?: string;
    body: string; authorId: UserId;
    createdAt: string; editedAt?: string; deletedAt?: string;
    likeCount: number; replyCount: number;
    moderation: ModerationType
    version: number;
    // local-only
    optimistic?: boolean;
}


type CommentId = string;
type CafeId = string;
type UserId = string;

export type CommentsStateWl = {
    entities: EntityState<CommentEntity,CommentId>;

    // Vue par café : ordre d’affichage + pagination
    byTarget: {
        [targetId: string]: {
            ids: CommentId[];                 // newest → oldest (ou selon le tri courant)
            nextCursor?: string;              // keyset pagination
            prevCursor?: string;
            loading: LoadingState;
            error?: string;
            filters: { sort: "new" | "top"; mineOnly?: boolean };
        };
    };
    byParent?: {
        [parentId: string]: {
            ids: CommentId[];                 // ordre local des réponses
            nextCursor?: string;
        };
    };

    ui: {
        composing: {
            targetId?: CafeId;
            parentId?: CommentId;
            draftBody: string;                // persistance AsyncStorage par (targetId+parentId)
            sending: boolean;
            error?: string;
        };
    };
};

export const loadingStates = {
    IDLE: "IDLE",
    PENDING: "PENDING",
    ERROR: "ERROR"
} as const;

export type LoadingState = typeof loadingStates[keyof typeof loadingStates]

export const moderationTypes = {
    PUBLISHED: "PUBLISHED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
    SOFT_DELETED: "SOFT_DELETED"
} as const;

export type ModerationType = typeof moderationTypes[keyof typeof moderationTypes]