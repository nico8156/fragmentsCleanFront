import { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {
    AppUser,
    LinkedIdentity,
    ProviderId,
    ProviderUserId,
    toIdentityId,
    toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { getProfileOrDefault } from "@/app/adapters/secondary/fakeData/communityProfiles";

const buildIdentity = (
    provider: ProviderId,
    providerUserId: ProviderUserId,
    email: string,
): LinkedIdentity => ({
    id: toIdentityId(`${provider}:${providerUserId}:identity`),
    provider,
    providerUserId,
    email,
    createdAt: parseToISODate(new Date().toISOString()),
    lastAuthAt: parseToISODate(new Date().toISOString()),
});

export class DemoUserRepo implements UserRepo {
    private cache = new Map<string, AppUser>();

    async getById(id: AppUser["id"]): Promise<AppUser | null> {
        if (!this.cache.has(id)) {
            const [provider, providerUserId] = id.split(":");
            const profileSeed = getProfileOrDefault(providerUserId);
            const identity = buildIdentity(
                provider as ProviderId,
                toProviderUserId(providerUserId),
                profileSeed.email,
            );
            const now = parseToISODate(new Date().toISOString());
            this.cache.set(id, {
                id,
                createdAt: now,
                updatedAt: now,
                displayName: profileSeed.displayName,
                avatarUrl: profileSeed.avatarUrl,
                bio: profileSeed.bio ?? "Caféiné et prêt à explorer",
                identities: [identity],
                roles: ["user"],
                flags: { beta: true },
                preferences: { locale: "fr-FR", theme: "system" },
                likedCoffeeIds: [],
                version: 1,
            });
        }
        const user = this.cache.get(id);
        return user ? { ...user, identities: [...user.identities] } : null;
    }
}
