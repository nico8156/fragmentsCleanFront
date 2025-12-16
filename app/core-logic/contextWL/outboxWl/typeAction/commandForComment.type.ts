// commandForComment.type.ts
import { CommandId, commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

// ===== CREATE =====
export type CommentCreateCommand = {
    kind: typeof commandKinds.CommentCreate;
    commandId: CommandId | string;
    tempId: string;       // ✅ indispensable
    targetId: string;
    body: string;
    at: ISODate | string;
    parentId?: string | null;
    version?: number;
};

export type CommentCreateUndo = {
    kind: typeof commandKinds.CommentCreate;
    commentId: string;
    targetId: string;
    parentId?: string | null;
};

// ===== UPDATE =====
export type CommentUpdateCommand = {
    kind: typeof commandKinds.CommentUpdate;
    commandId: CommandId;
    commentId: string;
    newBody: string;
    at: ISODate;
};

export type CommentUpdateUndo = {
    kind: typeof commandKinds.CommentUpdate;
    commentId: string;
    prevBody: string;
    prevVersion?: number;
};

// ===== DELETE =====
export type CommentDeleteCommand = {
    kind: typeof commandKinds.CommentDelete;
    commandId: CommandId;
    commentId: string;
    at: ISODate;
};

export type CommentDeleteUndo = {
    kind: typeof commandKinds.CommentDelete;
    commentId: string;
    prevBody?: string;
    prevDeletedAt?: ISODate;
    prevVersion?: number;
};
