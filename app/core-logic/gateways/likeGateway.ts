import { Like } from "@/app/store/appState";

export interface LikeGateway {
    retrieveLike(): Promise<Like[]>;
    like(coffeeId: string, userId: string): Promise<void>;
    unlike(coffeeId: string, userId: string): Promise<void>;
}