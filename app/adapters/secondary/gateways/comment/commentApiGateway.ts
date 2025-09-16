import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import { Comment } from "@/app/store/appState";
import {CommentApiHandler} from "@/app/adapters/secondary/gateways/comment/commentApiHandler";

export class CommentApiGateway implements CommentGateway {

    constructor(private readonly commentHandler: CommentApiHandler) {}

    async retrieveComment(): Promise<Comment[]> {
        const apiResponse = await this.commentHandler.loadComment();
        if (!apiResponse) {
            return []as Comment[];
        }
        return apiResponse;
    }
    saveComment(commentId: string, userId: string, content: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateComment(commentId: string, userId: string, content: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteComment(commentId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}