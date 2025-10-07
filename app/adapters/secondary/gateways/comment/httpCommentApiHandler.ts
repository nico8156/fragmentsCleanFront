import {CommentApiHandler} from "@/app/adapters/secondary/gateways/comment/commentApiHandler";
import { Comment } from "@/app/contexts/comment/comment.type"
import {commentData} from "@/assets/data/comment";

export class HttpCommentApiHandler implements CommentApiHandler {
    loadComment(): Promise<Comment[]> {
        return Promise.resolve(commentData);
    }

}