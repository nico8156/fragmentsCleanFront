import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import { Like } from "@/app/store/appState";

export class FakeLikeGateway implements LikeGateway{
    set({ targetId, liked, commandId }: { targetId: string; liked: boolean; commandId: string; }): Promise<any> {
        return Promise.resolve(5);
    }
    nextLike: Like[] | [] = [];

    async retrieveLike(): Promise<Like[]> {
        return this.nextLike!;
    }

    async like(coffeeId: string, userId: string): Promise<void> {

    }
    async unlike(coffeeId: string, userId: string): Promise<void> {

    }

}
