
//PORT === COMMENT
import {ListCommentsResult} from "@/app/contextWL/commentWl/type/commentWl.type";

export interface CommentsWlGateway{
    list(params: { targetId: string; cursor: string; limit: number; signal: AbortSignal }): Promise<ListCommentsResult>;
    create({commandId, targetId, parentId, body}:{commandId: string, targetId : string, parentId?: string | null, body: string}):Promise<void>
    update({commandId, commentId, body, updatedAt}:{commandId: string, commentId:string, body:string, updatedAt?:string}):Promise<void>
    delete({commandId, commentId, deletedAt}:{commandId: string, commentId:string, deletedAt: string}):Promise<void>
}