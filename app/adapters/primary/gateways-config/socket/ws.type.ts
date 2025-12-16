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

export type WsInboundEvent =
    | LikeAddedAck
    | LikeRemovedAck
    | CommentCreatedAck
    | CommentUpdatedAck
    | CommentDeletedAck;

// ----------------------------------------------------------------------------
// Guard (narrowing réel)
// ----------------------------------------------------------------------------
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";

// export const isWsInboundEvent = (x: unknown): x is WsInboundEvent => {
//     if (!x || typeof x !== "object") return false;
//     const o = x as any;
//     if (!isStr(o.type) || !isStr(o.commandId)) return false;
//
//     // likes
//     if (o.type === "social.like.added_ack" || o.type === "social.like.removed_ack") {
//         return (
//             isStr(o.targetId) &&
//             isNum(o.count) &&
//             isBool(o.me) &&
//             isNum(o.version) &&
//             isStr(o.updatedAt)
//         );
//     }
//
//     // comment created
//     if (o.type === "social.comment.created_ack") {
//         return (
//             isStr(o.targetId) &&
//             isStr(o.commentId) &&
//             isNum(o.version) &&
//             isStr(o.updatedAt)
//         );
//     }
//
//     // comment updated
//     if (o.type === "social.comment.updated_ack") {
//         return (
//             isStr(o.targetId) &&
//             isStr(o.commentId) &&
//             isStr(o.body) &&
//             isNum(o.version) &&
//             isStr(o.editedAt)
//         );
//     }
//
//     // comment deleted
//     if (o.type === "social.comment.deleted_ack") {
//         return (
//             isStr(o.targetId) &&
//             isStr(o.commentId) &&
//             isNum(o.version) &&
//             isStr(o.deletedAt)
//         );
//     }
//
//     return false;
// };
export const isWsInboundEvent = (x: unknown): x is WsInboundEvent => {
    if (!x || typeof x !== "object") return false;
    const o = x as any;
    return typeof o.type === "string" && typeof o.commandId === "string";
};
