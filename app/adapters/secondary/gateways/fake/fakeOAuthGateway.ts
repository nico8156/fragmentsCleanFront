import { OAuthGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {
    OAuthProfile,
    ProviderAuthorizationResult,
    ProviderId,
    toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

export class FakeOAuthGateway implements OAuthGateway {
    public profile: OAuthProfile = {
        provider: "google",
        providerUserId: toProviderUserId("fake-user"),
        displayName: "Fake User",
        email: "fake@example.com",
    };

    public authorization: ProviderAuthorizationResult = {
        authorizationCode: "fake-authorization-code",
        codeVerifier: "fake-code-verifier",
        redirectUri: "fragmentscleanfront://auth/google",
    };

    public shouldFail = false;
    public signOutProvider?: ProviderId;

    async startSignIn(_provider: ProviderId): Promise<{ profile: OAuthProfile; authorization: ProviderAuthorizationResult }> {
        if (this.shouldFail) throw new Error("oauth failed");
        return { profile: { ...this.profile }, authorization: { ...this.authorization } };
    }

    async signOut(provider: ProviderId): Promise<void> {
        this.signOutProvider = provider;
        if (this.shouldFail) throw new Error("signout failed");
    }
}
