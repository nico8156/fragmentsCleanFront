import {CommandId, commandKinds, ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";

// ===== Comments =====

export type CommentCreateCommand = {
    kind: typeof commandKinds.CommentCreate;
    commandId: CommandId;
    tempId: string;                  // id client provisoire
    targetId: string;                // ressource commentée
    parentId?: string | null;        // thread
    body: string;
    at: ISODate;
};
export type CommentCreateUndo = {
    kind: typeof commandKinds.CommentCreate;
    tempId: string;                  // pour rollback local (supprimer le ghost)
};

export type CommentEditCommand = {
    kind: typeof commandKinds.CommentUpdate;
    commandId: CommandId;
    commentId: string;
    newBody: string;
    version?: number;
    at: ISODate;
};
export type CommentEditUndo = {
    kind: typeof commandKinds.CommentUpdate;
    commentId: string;
    prevBody: string;
    prevVersion: number;
};

export type CommentDeleteCommand = {
    kind: typeof commandKinds.CommentDelete;
    commandId: CommandId;
    commentId: string;
    version?: number;
    at: ISODate;
};
export type CommentDeleteUndo = {
    kind: typeof commandKinds.CommentDelete;
    commentId: string;
    prevBody:string
    prevDeletedAt?: ISODate; // soft delete
    prevVersion: number;
};