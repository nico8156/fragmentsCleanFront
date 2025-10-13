import {EntityState} from "@reduxjs/toolkit";

type ISODate = string;

export type CommentEntity = {
    id: string; targetId: string; parentId?: string;
    body: string; authorId: UserId;
    createdAt: ISODate; editedAt?: ISODate; deletedAt?: ISODate;
    likeCount: number; replyCount: number;
    moderation: ModerationType
    version: number;
    // local-only
    optimistic?: boolean;
}

type CommentId = string;
export type CafeId = string;
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
            filters: { sort: "new" | "top"; mineOnly?: boolean }; // a voir plus tard pour cacher des views et changer des vues rapidement par filtres !
            anchor?: ISODate;
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

export type CommentDTO = {
    id: CommentId;
    targetId: CafeId;
    body: string;
    createdAt: ISODate;
    version: number;
};
export type ListCommentsParams = {
    targetId: CafeId;
    cursor?: string | null;
    limit?: number; // ex: 50
};
export type ListCommentsResponse = {
    items: CommentDTO[];
    nextCursor?: string | null;
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