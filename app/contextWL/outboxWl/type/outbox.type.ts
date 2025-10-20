import {
    LikeAddCommand,
    LikeAddUndo,
    LikeRemoveCommand,
    LikeRemoveUndo
} from "@/app/contextWL/outboxWl/type/commandForLike.type";
import {
    CommentCreateCommand, CommentCreateUndo,
    CommentDeleteCommand, CommentDeleteUndo,
    CommentEditCommand, CommentEditUndo
} from "@/app/contextWL/outboxWl/type/commandForComment.type";
import {TicketVerifyCommand, TicketVerifyUndo} from "@/app/contextWL/outboxWl/type/commandForTicket.type";

export type ISODate = string & { readonly __brand: "ISODate" };
export type CommandId = string & { readonly __brand: "CommandId" };

// ===== Unions =====
export type OutboxCommand =
    | LikeAddCommand
    | LikeRemoveCommand
    | CommentCreateCommand
    | CommentEditCommand
    | CommentDeleteCommand
    | TicketVerifyCommand;

export type OutboxUndo =
    | LikeAddUndo
    | LikeRemoveUndo
    | CommentCreateUndo
    | CommentEditUndo
    | CommentDeleteUndo
    | TicketVerifyUndo;

export type OutboxRecord = {
    id: string;                 // outboxId
    item: OutboxItem;           // { command, undo }
    status: StatusType;
    attempts: number;
    lastError?: string;
    enqueuedAt: string;
    nextCheckAt?: string; // optionnel: pour timeout/cleanup
};

export type OutboxStateWl = {
    byId: Record<string, OutboxRecord>;
    queue: string[];
    byCommandId: Record<string, string>;
};
// pour l'outboxItem, peut etre faire des types spe pour un comment ou ticket ou like ...
// un outboxItem peut contenir soit un ticket, un comment ou un like ...
export type OutboxItem = {
    command: OutboxCommand;
    undo: OutboxUndo;
};
// export type OutboxItem = {
//     command: {
//         kind: CommandKind;
//         commandId: string;
//         commentId?: string;
//         ticketId?: string;
//         tempId?: string;
//         targetId?: string;
//         parentId?: string;
//         body?: string;
//         newBody?: string;
//         version?: number;
//         createdAt?: string;
//         deletedAt?: string;
//         updatedAt?: string;
//     };
//     undo: {
//         kind:CommandKind;
//         tempId?: string;
//         commentId?: string;
//         targetId?: string;
//         prevBody?: string;
//         prevVersion?: number;
//         prevCount?:number;
//         prevMe?: boolean;
//         prevDeletedAt?: string;
//         parentId?: string
//     };
// };

export const commandKinds = {
    CommentCreate: "Comment.Create",
    CommentUpdate: "Comment.Update",
    CommentDelete: "Comment.Delete",
    CommentRetrieve: "Comment.Retrieve",
    LikeAdd:    "Like.Add",
    LikeRemove: "Like.Remove",
    TicketVerify: "Ticket.Verify",
} as const;

export type CommandKind = typeof commandKinds[keyof typeof commandKinds];

export const statusTypes = {
    queued: "queued",
    processing: "processing",
    succeeded: "succeeded",
    failed: "failed",
    awaitingAck: "awaitingAck"
} as const;

export type StatusType = typeof statusTypes[keyof typeof statusTypes];