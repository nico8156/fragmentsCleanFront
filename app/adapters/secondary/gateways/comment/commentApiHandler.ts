import {Comment} from "@/app/store/appState";

export interface CommentApiHandler {
    loadComment(): Promise<Comment[]>;
}