import {CommentApiHandler} from "@/app/adapters/secondary/gateways/comment/commentApiHandler";
import { Comment } from "@/app/store/appState";
import {commentData} from "@/assets/data/comment";

export class HttpCommentApiHandler implements CommentApiHandler {
    loadComment(): Promise<Comment[]> {
        return Promise.resolve(commentData);
    }

}