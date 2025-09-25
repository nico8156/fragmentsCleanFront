import { Like } from "@/app/store/appState";
import {OutboxItem} from "@/app/core-logic/gateways/outBoxGateway";

export interface LikeGateway {
    retrieveLike(): Promise<Like[]>;
    like(coffeeId: string, userId: string): Promise<void>;
    unlike(coffeeId: string, userId: string): Promise<void>;

    set({ targetId, liked, commandId}:{ targetId: string, liked: boolean, commandId: string }): Promise<any>;
}