import {Comment} from "@/app/store/appState";

export interface CommentGateway {
    retrieveComment(): Promise<Comment[]>;
    saveComment(userId: string, commentId : string, content: string): Promise<void>;
}
