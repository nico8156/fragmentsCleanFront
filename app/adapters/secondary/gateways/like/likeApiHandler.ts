import {Like} from "@/app/store/appState";

export interface LikeApiHandler {
    loadLike(): Promise<Like[]>;
}