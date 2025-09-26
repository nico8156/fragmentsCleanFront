import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import { Like } from "@/app/store/appState";
import {LikeApiHandler} from "@/app/adapters/secondary/gateways/like/likeApiHandler";

export class LikeApiGateway implements LikeGateway {

    constructor(private readonly likeApiHandler : LikeApiHandler ) {}

    set({ targetId, liked, commandId }: { targetId: string; liked: boolean; commandId: string; }): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async retrieveLike(): Promise<Like[]> {
        const apiResponse = await this.likeApiHandler.loadLike();
        if (!apiResponse) {
            return [] as Like[];
        }
        return apiResponse;
    }
    like(coffeeId: string, userId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    unlike(coffeeId: string, userId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}