import { OAuthGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {
    OAuthProfile,
    ProviderAuthorizationResult,
    ProviderId,
    toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { DEFAULT_COMMUNITY_PROFILE } from "@/app/adapters/secondary/fakeData/communityProfiles";

const randomToken = () => Math.random().toString(36).slice(2);

export class DemoOAuthGateway implements OAuthGateway {
    constructor(private delayMs = 600) {}

    async startSignIn(provider: ProviderId, opts?: { scopes?: string[] }): Promise<{
        profile: OAuthProfile;
        authorization: ProviderAuthorizationResult;
    }> {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
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
        const authorization: ProviderAuthorizationResult = {
            authorizationCode: randomToken(),
            codeVerifier: randomToken(),
            redirectUri: "com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect",
        };
        return { profile, authorization };
    }

    async signOut(_provider: ProviderId): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 120));
    }
}
