import { createAction } from "@reduxjs/toolkit";
import {BlockedUser, CommentEntity} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";


export const addOptimisticCreated = createAction<{ entity: CommentEntity }>("COMMENT/OPTIMISTIC_CREATED");

export const updateOptimisticApplied = createAction<{
    commentId: string;
    newBody: string;
    clientEditedAt: string;
}>("COMMENT/OPTIMISTIC_UPDATED");

export const deleteOptimisticApplied = createAction<{
    commentId: string;
    clientDeletedAt: string;
}>("COMMENT/OPTIMISTIC_DELETED");
export const reportOptimisticApplied = createAction<{ commentId: string }>("COMMENT/REPORT_OPTIMISTIC_APPLIED");
export const reportRollback = createAction<{ commentId: string }>("COMMENT/REPORT_ROLLBACK");
export const blockOptimisticApplied = createAction<{ block: BlockedUser }>("COMMENT/BLOCK_OPTIMISTIC_APPLIED");
export const unblockOptimisticApplied = createAction<{ userId: string }>("COMMENT/UNBLOCK_OPTIMISTIC_APPLIED");
export const blockRollback = createAction<{ previous?: BlockedUser; userId: string }>("COMMENT/BLOCK_ROLLBACK");
export const blockedUsersPending = createAction("COMMENT/BLOCKED_USERS_PENDING");
export const blockedUsersRetrieved = createAction<{ items: BlockedUser[] }>("COMMENT/BLOCKED_USERS_RETRIEVED");
export const blockedUsersFailed = createAction<{ error: string }>("COMMENT/BLOCKED_USERS_FAILED");
