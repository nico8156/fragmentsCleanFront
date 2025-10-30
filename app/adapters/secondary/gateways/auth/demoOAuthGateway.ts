import { OAuthGateway } from "@/app/contextWL/userWl/gateway/user.gateway";
import {
    AuthTokens,
    OAuthProfile,
    ProviderId,
    toProviderUserId,
} from "@/app/contextWL/userWl/typeAction/user.type";

const randomToken = () => Math.random().toString(36).slice(2);

export class DemoOAuthGateway implements OAuthGateway {
    constructor(private delayMs = 600) {}

    async startSignIn(provider: ProviderId, opts?: { scopes?: string[] }): Promise<{
        profile: OAuthProfile;
        tokens: AuthTokens;
    }> {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        const now = Date.now();
        const providerUserId = toProviderUserId(`demo-${provider}-${randomToken()}`);
        const profile: OAuthProfile = {
            provider,
            providerUserId,
            email: `demo.${provider}@example.com`,
            emailVerified: true,
            displayName: "Demo User",
            avatarUrl: `https://i.pravatar.cc/150?u=${providerUserId}`,
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
