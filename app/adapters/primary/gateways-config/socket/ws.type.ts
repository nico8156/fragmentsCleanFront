export type ISODate = string & { readonly __brand: "ISODate" };

// --- event type strings (wire) ---
export type WsInboundType =
    | "social.like.added_ack"
    | "social.like.removed_ack"
    | "social.comment.created_ack"
    | "social.comment.updated_ack"
    | "social.comment.deleted_ack"
    | "ticket.verify.accepted_ack"
    | "ticket.verify.rejected_ack";

// --- base ---
export type WsInboundBase = {
    type: WsInboundType;
    commandId: string;
    updatedAt?: ISODate;
};

// --- likes ---
export type LikeAckWire = WsInboundBase & {
    type: "social.like.added_ack" | "social.like.removed_ack";
    targetId: string;
    count: number;
    me: boolean;
    version: number;
};

// --- comments ---
export type CommentAckWire = WsInboundBase & {
    type:
        | "social.comment.created_ack"
        | "social.comment.updated_ack"
        | "social.comment.deleted_ack";
    targetId: string;
    commentId: string;
    version: number;
    // optionnel: payload minimal (ex: text) si tu veux reconciler sans refetch
    // text?: string;
};

// --- tickets verify ---
export type TicketVerifyAckWire = WsInboundBase & {
    type: "ticket.verify.accepted_ack" | "ticket.verify.rejected_ack";
    ticketId: string;
    targetId?: string;
    // optionnel: reason / score / etc
    reason?: string;
};

export type WsInboundEvent = LikeAckWire | CommentAckWire | TicketVerifyAckWire;

export const isWsInboundEvent = (x: any): x is WsInboundEvent =>
    !!x && typeof x === "object" && typeof x.type === "string" && typeof x.commandId === "string";
