// ----------------------------------------------------------------------------
// Shared
// ----------------------------------------------------------------------------
export type ISODate = string & { readonly __brand: "ISODate" };

// ----------------------------------------------------------------------------
// Flat events (matches backend logs)
// ----------------------------------------------------------------------------
export type LikeAddedAck = {
    type: "social.like.added_ack";
    commandId: string;
    targetId: string;
    count: number;
    me: boolean;
    version: number;
    updatedAt: string; // ou ISODate si tu castes
};

export type LikeRemovedAck = {
    type: "social.like.removed_ack";
    commandId: string;
    targetId: string;
    count: number;
    me: boolean;
    version: number;
    updatedAt: string;
};

export type CommentCreatedAck = {
    type: "social.comment.created_ack";
    commandId: string;
    targetId: string;
    commentId: string;
    version: number;
    updatedAt: string;
};

export type CommentUpdatedAck = {
    type: "social.comment.updated_ack";
    commandId: string;
    targetId: string;
    commentId: string;
    body: string;
    version: number;
    editedAt: string;
};

export type CommentDeletedAck = {
    type: "social.comment.deleted_ack";
    commandId: string;
    targetId: string;
    commentId: string;
    version: number;
    deletedAt: string;
};

export type TicketVerificationOutcome =
    | "APPROVED"
    | "REJECTED"
    | "FAILED_RETRYABLE"
    | "FAILED_FINAL";

export type TicketVerificationCompletedAck = {
    type: "ticket.verification.completed_ack";
    commandId: string;
    ticketId: string;
    outcome: TicketVerificationOutcome;
    version: number;
    updatedAt: string;
    payloadJson: string; // JSON string de l'event complet
};

export type WsInboundEvent =
    | LikeAddedAck
    | LikeRemovedAck
    | CommentCreatedAck
    | CommentUpdatedAck
    | CommentDeletedAck
    | TicketVerificationCompletedAck

export const isWsInboundEvent = (x: unknown): x is WsInboundEvent => {
    if (!x || typeof x !== "object") return false;
    const o = x as any;
    return typeof o.type === "string" && typeof o.commandId === "string";
};
