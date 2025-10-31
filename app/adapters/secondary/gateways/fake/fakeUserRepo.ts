import { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { AppUser, toUserId } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {parseToISODate} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export class FakeUserRepo implements UserRepo {
    public users: Map<string, AppUser> = new Map();

    constructor(seed?: AppUser[]) {
        seed?.forEach((user) => this.users.set(user.id, user));
    }

    async getById(id: AppUser["id"]): Promise<AppUser | null> {
        const user = this.users.get(id);
        return user ? { ...user, identities: [...user.identities] } : null;
    }

    upsert(user: AppUser) {
        this.users.set(user.id, user);
    }
}

export const makeDemoUser = (): AppUser => ({
    id: toUserId("google:fake-user"),
    createdAt: parseToISODate(new Date(2024, 0, 1).toISOString()),
    updatedAt: parseToISODate(new Date(2024, 0, 1).toISOString()),
    displayName: "Fake User",
    avatarUrl: "https://i.pravatar.cc/150?u=fake-user",
    identities: [],
    roles: ["user"],
    likedCoffeeIds: [],
    version: 1,
});
