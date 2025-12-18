
//PORT === COMMENT
import {ListCommentsResult, Op} from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";

export interface CommentsWlGateway{
    list(params: { targetId: string; cursor?: string; limit?: number; signal: AbortSignal, op?:Op }): Promise<ListCommentsResult>;
    create({commandId, targetId, parentId, body, tempId}:{commandId: string, targetId : string, parentId?: string | null, body: string, tempId?: string}):Promise<void>
    update({commandId, commentId, body, editedAt}:{commandId: string, commentId:string, body:string, editedAt?:string}):Promise<void>
    delete({commandId, commentId, deletedAt}:{commandId: string, commentId:string, deletedAt: string}):Promise<void>
}