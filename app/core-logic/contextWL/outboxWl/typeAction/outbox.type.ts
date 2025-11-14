import {
    LikeAddCommand,
    LikeAddUndo,
    LikeRemoveCommand,
    LikeRemoveUndo
} from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForLike.type";
import {
    CommentCreateCommand, CommentCreateUndo,
    CommentDeleteCommand, CommentDeleteUndo,
    CommentUpdateCommand, CommentUpdateUndo
} from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForComment.type";
import {TicketVerifyCommand, TicketVerifyUndo} from "@/app/core-logic/contextWL/outboxWl/typeAction/commandForTicket.type";

export type ISODate = string & { readonly __brand: "ISODate" };
export type CommandId = string & { readonly __brand: "CommandId" };

export const parseToCommandId = (commandId: string): CommandId => commandId as CommandId;

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

export type OutboxItem = {
    command: OutboxCommand;
    undo: OutboxUndo;
};
// ===== Unions =====
export type OutboxCommand =
    | LikeAddCommand
    | LikeRemoveCommand
    | CommentCreateCommand
    | CommentUpdateCommand
    | CommentDeleteCommand
    | TicketVerifyCommand;

export type OutboxUndo =
    | LikeAddUndo
    | LikeRemoveUndo
    | CommentCreateUndo
    | CommentUpdateUndo
    | CommentDeleteUndo
    | TicketVerifyUndo;

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