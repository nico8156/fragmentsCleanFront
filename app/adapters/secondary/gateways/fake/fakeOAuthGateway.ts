import { OAuthGateway } from "@/app/contextWL/userWl/gateway/user.gateway";
import {
    AuthTokens,
    OAuthProfile,
    ProviderId,
    toProviderUserId,
} from "@/app/contextWL/userWl/typeAction/user.type";

export class FakeOAuthGateway implements OAuthGateway {
    public profile: OAuthProfile = {
        provider: "google",
        providerUserId: toProviderUserId("fake-user"),
        displayName: "Fake User",
        email: "fake@example.com",
    };

    public tokens: AuthTokens = {
        accessToken: "fake-access-token",
        refreshToken: "fake-refresh-token",
        expiresAt: Date.now() + 60 * 60 * 1000,
        issuedAt: Date.now(),
        tokenType: "Bearer",
        scope: "openid email profile",
    };

    public shouldFail = false;
    public signOutProvider?: ProviderId;

    async startSignIn(_provider: ProviderId): Promise<{ profile: OAuthProfile; tokens: AuthTokens }> {
        if (this.shouldFail) throw new Error("oauth failed");
        return { profile: { ...this.profile }, tokens: { ...this.tokens } };
    }

    async signOut(provider: ProviderId): Promise<void> {
        this.signOutProvider = provider;
        if (this.shouldFail) throw new Error("signout failed");
    }
}
