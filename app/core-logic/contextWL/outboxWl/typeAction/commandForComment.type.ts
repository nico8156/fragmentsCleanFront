// commandForComment.type.ts
import { CommandId, commandKinds, ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { BlockedUser, ReportReason } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

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
    tempId: string;
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

export type CommentReportCommand = { kind: typeof commandKinds.CommentReport; commandId: CommandId; reportId:string; commentId:string; reason:ReportReason; details?:string; at:ISODate };
export type CommentReportUndo = { kind: typeof commandKinds.CommentReport; commentId:string };
export type UserBlockCommand = { kind: typeof commandKinds.UserBlockSet; commandId:CommandId; blockId:string; blockedUserId:string; active:boolean; at:ISODate };
export type UserBlockUndo = { kind: typeof commandKinds.UserBlockSet; userId:string; previous?:BlockedUser };
