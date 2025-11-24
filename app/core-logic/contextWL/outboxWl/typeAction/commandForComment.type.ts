import {CommandId, commandKinds, ISODate} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

// ===== Comments =====

export type CommentCreateCommand = {
    kind: typeof commandKinds.CommentCreate;
    commandId: CommandId | string;
    tempId: string;                  // id client provisoire
    targetId: string;                // ressource commentée
    body: string;
    at: ISODate | string;
    parentId?: string | null;        // thread
    version?: number;
};
export type CommentCreateUndo = {
    kind: typeof commandKinds.CommentCreate;
    tempId: string;                  // pour rollback local (supprimer le ghost)
    targetId: string;
    parentId?: string;
};

export type CommentUpdateCommand = {
    kind: typeof commandKinds.CommentUpdate;
    commandId: CommandId | string;
    commentId: string;
    newBody: string;
    at?: ISODate | string;
    version?: number;
};
export type CommentUpdateUndo = {
    kind: typeof commandKinds.CommentUpdate;
    commentId: string;
    prevBody: string;
    prevVersion?: number;
};

export type CommentDeleteCommand = {
    kind: typeof commandKinds.CommentDelete;
    commandId: CommandId | string;
    commentId: string;
    at: ISODate | string;
};
export type CommentDeleteUndo = {
    kind: typeof commandKinds.CommentDelete;
    commentId: string;
    prevBody?:string
    prevDeletedAt?: ISODate | string; // soft delete
    prevVersion?: number;
};