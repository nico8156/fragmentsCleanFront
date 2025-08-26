import {Comment} from "@/app/store/appState";

export interface CommentGateway {
    retrieveComment(): Promise<Comment[]>;
}
