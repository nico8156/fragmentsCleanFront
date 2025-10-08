export type OutboxRecord = {
    id: string;                 // outboxId
    item: OutboxItem;           // { command, undo }
    status: StatusType;
    attempts: number;
    lastError?: string;
    enqueuedAt: string;
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
        tempId: string;
        targetId: string;
        parentId?: string;
        body: string;
        createdAt: string;
    };
    undo: { kind:CommandKind; tempId: string; targetId: string; parentId?: string };
};

export const commandKinds = {
    CommentCreate: "Comment.Create"
} as const;

export type CommandKind = typeof commandKinds[keyof typeof commandKinds];

export const statusTypes = {
    queued: "queued",
    processing: "processing",
    succeeded: "succeeded",
    failed: "failed"
} as const;

export type StatusType = typeof statusTypes[keyof typeof statusTypes];