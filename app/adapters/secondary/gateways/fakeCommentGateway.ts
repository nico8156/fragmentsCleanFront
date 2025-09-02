import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {Comment} from "@/app/store/appState";

export class FakeCommentGateway implements CommentGateway{
nextComment: Comment[] | [] = [];

    async retrieveComment(): Promise<Comment[]> {
        //TODO call to server
        return this.nextComment!;
    }
    async saveComment(userId: string, commentId: string , content: string): Promise<void> {
        //TODO call to server
        let comment: Comment = {
            id : userId,
            text : content,
        }
        this.nextComment = [...this.nextComment!, comment];
    }
    async deleteComment(commentId: string): Promise<void> {
        //TODO call to server
        this.nextComment = this.nextComment.filter(c => {
            if(c.id === commentId){
                return;
            } else {
                return c;
            }
        });
    }

    async updateComment(userdId: string, commentId: string, content: string ): Promise<void> {
        //TODO call to server
        this.nextComment = this.nextComment.map(c => {
            if(c.id === commentId){
                c.text = content;
            }
            return c;
        });
    }
}
