import {LikeApiHandler} from "@/app/adapters/secondary/gateways/like/likeApiHandler";
import { Like } from "@/app/store/appState";
import {commentData} from "@/assets/data/comment";

export class HttpLikeApiHandler implements LikeApiHandler {
    loadLike(): Promise<Like[]> {
        return Promise.resolve(commentData);
    }
}