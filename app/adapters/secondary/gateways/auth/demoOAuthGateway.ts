import { OAuthGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {
    AuthTokens,
    OAuthProfile,
    ProviderId,
    toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { DEFAULT_COMMUNITY_PROFILE } from "@/app/adapters/secondary/fakeData/communityProfiles";

const randomToken = () => Math.random().toString(36).slice(2);

export class DemoOAuthGateway implements OAuthGateway {
    constructor(private delayMs = 600) {}

    async startSignIn(provider: ProviderId, opts?: { scopes?: string[] }): Promise<{
        profile: OAuthProfile;
        tokens: AuthTokens;
    }> {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        const now = Date.now();
        const profileSeed = DEFAULT_COMMUNITY_PROFILE;
        const providerUserId = toProviderUserId(profileSeed.id);
        const profile: OAuthProfile = {
            provider,
            providerUserId,
            email: profileSeed.email,
            emailVerified: true,
            displayName: profileSeed.displayName,
            avatarUrl: profileSeed.avatarUrl,
            locale: "fr",
        };
        const tokens: AuthTokens = {
            accessToken: randomToken(),
            refreshToken: randomToken(),
            idToken: randomToken(),
            expiresAt: now + 60 * 60 * 1000,
            issuedAt: now,
            tokenType: "Bearer",
            scope: (opts?.scopes ?? ["openid", "email", "profile"]).join(" "),
        };
        return { profile, tokens };
    }

    async signOut(_provider: ProviderId): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 120));
    }
}
