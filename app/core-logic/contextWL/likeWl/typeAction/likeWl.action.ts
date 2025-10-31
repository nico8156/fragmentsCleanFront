import {createAction} from "@reduxjs/toolkit";
import { TargetId} from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.type";
import {ISODate} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";

export const likesRetrievalPending  = createAction<{ targetId: TargetId }>("LIKES/RETRIEVAL_PENDING");
export const likesRetrieved         = createAction<{ targetId: TargetId; count: number; me: boolean; version: number; serverTime?: string }>("LIKES/RETRIEVED");
export const likesRetrievalFailed   = createAction<{ targetId: TargetId; error: string }>("LIKES/RETRIEVAL_FAILED");

// actions optimistes
export const likeOptimisticApplied   = createAction<{ targetId: TargetId; clientAt: ISODate }>("LIKE/OPTIMISTIC_APPLIED");
export const unlikeOptimisticApplied = createAction<{ targetId: TargetId; clientAt: ISODate }>("UNLIKE/OPTIMISTIC_APPLIED");

// reconcile / rollback
export const likeReconciled   = createAction<{ targetId: TargetId; server: { count: number; me: boolean; version: number; updatedAt?: ISODate } }>("LIKE/RECONCILED");
export const likeRollback     = createAction<{ targetId: TargetId; prevCount: number; prevMe: boolean; prevVersion?: number }>("LIKE/ROLLBACK");
