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
        newBody?: string;
        version?: number;
        createdAt?: string;
        deletedAt?: string;
        updatedAt?: string;
    };
    undo: {
        kind:CommandKind;
        tempId?: string;
        commentId?: string;
        targetId?: string;
        prevBody?: string;
        prevVersion?: number;
        prevCount?:number;
        prevMe?: boolean;
        prevDeletedAt?: string;
        parentId?: string
    };
};

export const commandKinds = {
    CommentCreate: "Comment.Create",
    CommentUpdate: "Comment.Update",
    CommentDelete: "Comment.Delete",
    CommentRetrieve: "Comment.Retrieve",
    LikeAdd:    "Like.Add",
    LikeRemove: "Like.Remove",
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