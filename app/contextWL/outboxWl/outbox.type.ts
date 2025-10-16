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
    command: {
        kind: CommandKind;
        commandId: string;
        commentId?: string;
        tempId?: string;
        targetId?: string;
        parentId?: string;
        body?: string;
        createdAt: string;
    };
    undo: {
        kind:CommandKind;
        tempId?: string;
        commentId?: string;
        targetId?: string;
        prevBody?: string;
        prevVersion?: number;
        prevDeletedAt?: string;
        parentId?: string
    };
};

export const commandKinds = {
    CommentCreate: "Comment.Create",
    CommentUpdate: "Comment.Update",
    CommentDelete: "Comment.Delete",
    CommentRetrieve: "Comment.Retrieve"
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