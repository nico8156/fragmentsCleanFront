import {
    GoogleSignin,
    isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import {
    AuthTokens,
    OAuthProfile,
    ProviderId,
    toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {OAuthGateway} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";

GoogleSignin.configure({
    iosClientId: "255942605258-kjbb93iq5tlhpc74d75h8jntajvqpilt.apps.googleusercontent.com",
    offlineAccess: true,
    webClientId: "255942605258-5errelo3uh5perq07b4cnj87l6rgsplp.apps.googleusercontent.com",
})

export const googleOAuthGateway: OAuthGateway = {
    async startSignIn(provider: ProviderId, opts?: { scopes?: string[] }) {
        if (provider !== "google") {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (!isSuccessResponse(response)) {
            throw new Error("Google sign-in cancelled");
        }

        const { idToken, serverAuthCode, scopes, user } = response.data;

        if (!serverAuthCode) {
            throw new Error("No serverAuthCode returned by Google");
        }

        const profile: OAuthProfile = {
            provider: "google",
            providerUserId: toProviderUserId(user.id),
            email: user.email,
            emailVerified: true, // on pourra raffiner, mais c'est souvent vrai
            displayName: user.name ?? undefined,
            avatarUrl: user.photo ?? undefined,
            locale: undefined,
        };

        // ICI : ce ne sont pas les tokens de TON app,
        // juste ce qu'on veut passer au backend
        const tokens: AuthTokens = {
            accessToken: serverAuthCode, // temporairement "détourné" pour porter l'authCode
            idToken: idToken ?? undefined,
            refreshToken: undefined,
            expiresAt: Date.now() + 5 * 60 * 1000, // code très court terme
            issuedAt: Date.now(),
            tokenType: "Bearer",
            scope: scopes.join(" "),
        };
        console.log("tokens", tokens);
        console.log("profile", profile);
        return { profile, tokens };
    },

    async signOut(provider: ProviderId): Promise<void> {
        if (provider !== "google") return;
        // TODO: GoogleSignin.signOut() si tu veux
    },
};
