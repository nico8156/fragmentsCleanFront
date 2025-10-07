import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {Comment} from "@/app/contexts/comment/comment.type";

export class FakeCommentGateway implements CommentGateway{
    saveComment(commentId: string, userId: string, content: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateComment(commentId: string, userId: string, content: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteComment(commentId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
nextComment: Comment[] | [] = [];

    async retrieveComment(): Promise<Comment[]> {
        //TODO call to server
        return this.nextComment!;
    }
}
