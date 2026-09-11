import { createAction, nanoid, TypedStartListening } from "@reduxjs/toolkit";
import { createListenerMiddleware } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";
import type { AppStateWl, DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { blockOptimisticApplied, reportOptimisticApplied, unblockOptimisticApplied } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import type { ReportReason } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { commandKinds, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { enqueueCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

export const uiCommentReportRequested = createAction<{ commentId:string; reason:ReportReason; details?:string }>("UI/COMMENT/REPORT_REQUESTED");
export const uiUserBlockRequested = createAction<{ userId:string; displayName?:string; avatarUrl?:string }>("UI/USER/BLOCK_REQUESTED");
export const uiUserUnblockRequested = createAction<{ userId:string }>("UI/USER/UNBLOCK_REQUESTED");

export const commentModerationUseCaseFactory = (deps: DependenciesWl) => {
    const mw=createListenerMiddleware();
    const listen=mw.startListening as TypedStartListening<AppStateWl,AppDispatchWl>;

    listen({ actionCreator:uiCommentReportRequested, effect:async ({payload},api) => {
        const state:any=api.getState();
        if (state.cState.reportedCommentIds[payload.commentId]) return;
        const commandId=deps.helpers.newCommandId(), reportId=deps.helpers.newCommandId();
        const at=(deps.helpers.nowIso?.() ?? new Date().toISOString()) as ISODate;
        api.dispatch(reportOptimisticApplied({commentId:payload.commentId}));
        api.dispatch(enqueueCommitted({ id:`obx_${nanoid()}`, enqueuedAt:at, item:{
            command:{kind:commandKinds.CommentReport,commandId,reportId,commentId:payload.commentId,reason:payload.reason,details:payload.details,at},
            undo:{kind:commandKinds.CommentReport,commentId:payload.commentId},
        }}));
        api.dispatch(outboxProcessOnce());
    }});

    listen({ actionCreator:uiUserBlockRequested, effect:async ({payload},api) => {
        const state:any=api.getState(); const previous=state.cState.blockedUsers[payload.userId];
        if (previous) return;
        const commandId=deps.helpers.newCommandId(), blockId=deps.helpers.newCommandId();
        const at=(deps.helpers.nowIso?.() ?? new Date().toISOString()) as ISODate;
        api.dispatch(blockOptimisticApplied({block:{blockId,userId:payload.userId,displayName:payload.displayName,
            avatarUrl:payload.avatarUrl,blockedAt:at,version:0}}));
        api.dispatch(enqueueCommitted({id:`obx_${nanoid()}`,enqueuedAt:at,item:{
            command:{kind:commandKinds.UserBlockSet,commandId,blockId,blockedUserId:payload.userId,active:true,at},
            undo:{kind:commandKinds.UserBlockSet,userId:payload.userId,previous},
        }})); api.dispatch(outboxProcessOnce());
    }});

    listen({ actionCreator:uiUserUnblockRequested, effect:async ({payload},api) => {
        const state:any=api.getState(); const previous=state.cState.blockedUsers[payload.userId];
        if (!previous) return;
        const commandId=deps.helpers.newCommandId();
        const at=(deps.helpers.nowIso?.() ?? new Date().toISOString()) as ISODate;
        api.dispatch(unblockOptimisticApplied({userId:payload.userId}));
        api.dispatch(enqueueCommitted({id:`obx_${nanoid()}`,enqueuedAt:at,item:{
            command:{kind:commandKinds.UserBlockSet,commandId,blockId:previous.blockId,blockedUserId:payload.userId,active:false,at},
            undo:{kind:commandKinds.UserBlockSet,userId:payload.userId,previous},
        }})); api.dispatch(outboxProcessOnce());
    }});
    return mw;
};
