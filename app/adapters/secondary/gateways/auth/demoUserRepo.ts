import { UserRepo } from "@/app/contextWL/userWl/gateway/user.gateway";
import {
    AppUser,
    LinkedIdentity,
    ProviderId,
    ProviderUserId,
    toIdentityId,
} from "@/app/contextWL/userWl/typeAction/user.type";

const buildIdentity = (
    provider: ProviderId,
    providerUserId: ProviderUserId,
): LinkedIdentity => ({
    id: toIdentityId(`${provider}:${providerUserId}:identity`),
    provider,
    providerUserId,
    email: `demo.${provider}@example.com`,
    createdAt: new Date().toISOString(),
    lastAuthAt: new Date().toISOString(),
});

export class DemoUserRepo implements UserRepo {
    private cache = new Map<string, AppUser>();

    async getById(id: AppUser["id"]): Promise<AppUser | null> {
        if (!this.cache.has(id)) {
            const [provider, providerUserId] = id.split(":");
            const identity = buildIdentity(provider as ProviderId, providerUserId as ProviderUserId);
            const now = new Date().toISOString();
            this.cache.set(id, {
                id,
                createdAt: now,
                updatedAt: now,
                displayName: "Demo User",
                avatarUrl: `https://i.pravatar.cc/120?u=${id}`,
                bio: "Caféiné et prêt à explorer",
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
