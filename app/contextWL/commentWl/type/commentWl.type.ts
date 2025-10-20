import {EntityState} from "@reduxjs/toolkit";

export type ISODate = string;

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

export type CommentId = string;
export type CafeId = string;
type UserId = string;

export type CommentsStateWl = {
    entities: EntityState<CommentEntity,CommentId>;
    // Vue par café : ordre d’affichage + pagination
    byTarget: Record<CafeId, View>
};

export type View = {
    ids: CommentId[];                 // ordre matérialisé pour l’UI (newest→oldest si "new")
    nextCursor?: string;              // pagination older
    prevCursor?: string;              // si besoin
    loading: LoadingState;
    error?: string;
    filters?: { sort: "new" | "top"; mineOnly?: boolean };
    // Cohérence & fraicheur
    anchor?: ISODate;                 // watermark serveur (snapshot)
    lastFetchedAt?: ISODate;          // dernier rafraîchissement côté client
    staleAfterMs?: number;            // TTL client (ex: 30s)
};

export type ListCommentsResult = {
    targetId: CafeId;
    op: Op;
    items: CommentEntity[];
    nextCursor?: string;
    prevCursor?: string;
    serverTime?: ISODate;
};

export const loadingStates = {
    IDLE: "IDLE",
    PENDING: "PENDING",
    ERROR: "ERROR",
    SUCCESS: "SUCCESS"
} as const;

export type LoadingState = typeof loadingStates[keyof typeof loadingStates]

export const moderationTypes = {
    PUBLISHED: "PUBLISHED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
    SOFT_DELETED: "SOFT_DELETED"
} as const;

export type ModerationType = typeof moderationTypes[keyof typeof moderationTypes]

export const opTypes = {
    RETRIEVE: "retrieve",
    OLDER: "older",
    REFRESH: "refresh"
} as const

export type Op = typeof opTypes[keyof typeof opTypes]