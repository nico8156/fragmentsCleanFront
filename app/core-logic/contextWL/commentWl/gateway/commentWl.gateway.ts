
//PORT === COMMENT
import {BlockedUser, ListCommentsResult, Op, ReportReason} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

export interface CommentsWlGateway{
    list(params: { targetId: string; cursor?: string; limit?: number; signal: AbortSignal, op?:Op }): Promise<ListCommentsResult>;
    create({commandId, targetId, parentId, body, tempId, at}:{commandId: string, targetId : string, parentId?: string | null, body: string, tempId?: string, at: string}):Promise<void>
    update({commandId, commentId, body, editedAt}:{commandId: string, commentId:string, body:string, editedAt:string}):Promise<void>
    delete({commandId, commentId, deletedAt}:{commandId: string, commentId:string, deletedAt: string}):Promise<void>
    report(input:{commandId:string; reportId:string; commentId:string; reason:ReportReason; details?:string; at:string}):Promise<void>
    setBlock(input:{commandId:string; blockId:string; blockedUserId:string; active:boolean; at:string}):Promise<void>
    listBlockedUsers(signal:AbortSignal):Promise<BlockedUser[]>
}
