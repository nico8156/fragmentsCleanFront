import {Comment} from "@/app/store/appState";

export interface CommentGateway {
    retrieveComment(): Promise<Comment[]>;
    saveComment( commentId : string,userId: string, content: string): Promise<void>;
    updateComment(commentId : string, userId: string, content: string): Promise<void>;
    deleteComment(commentId : string): Promise<void>;
}
