import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {Comment} from "@/app/store/appState";

export class FakeCommentGateway implements CommentGateway{
    nextComment: Comment[] | [] = [];

    async retrieveComment(): Promise<Comment[]> {
        return this.nextComment!;
    }
    async saveComment(userId: string, commentId: string , content: string): Promise<void> {
        let comment: Comment = {
            id : userId,
            text : content,
        }
        this.nextComment = [...this.nextComment!, comment];
    }
    async deleteComment(comment: Comment): Promise<void> {
        this.nextComment = this.nextComment.filter(c => {
            if(c.id === comment.id){
                return;
            } else {
                return c;
            }
        });
    }

    async updateComment(comment: Comment): Promise<void> {
        this.nextComment = this.nextComment.filter(c => {
            if (c.id === comment.id) {
                return comment;
            } else {
                return c;
            }
        });
    }
}
