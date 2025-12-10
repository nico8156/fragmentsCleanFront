// app/gateways/auth/googleOAuthGateway.expo.ts
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import {
    GoogleSignin,
    GoogleSigninButton, isErrorWithCode, isSuccessResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {jwtDecode} from "jwt-decode";

import {
    AuthTokens,
    OAuthProfile,
    ProviderId,
    toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {OAuthGateway} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
    iosClientId: "255942605258-kjbb93iq5tlhpc74d75h8jntajvqpilt.apps.googleusercontent.com",
    offlineAccess: true,
    webClientId: "255942605258-5errelo3uh5perq07b4cnj87l6rgsplp.apps.googleusercontent.com",
})
// Découverte Google standard
const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

type GoogleIdTokenPayload = {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    locale?: string;
};

const GOOGLE_CLIENT_ID = "255942605258-08bb4vadcl7ea1o0cu9v7u0mru6b0ioq.apps.googleusercontent.com";

const makeRedirectUri = () =>
    AuthSession.makeRedirectUri({
        native : "https://auth.expo.io/@nico8156/fragmentscleanfront"   // tu peux choisir le path
        // doit matcher ton scheme dans app.json / app.config.ts
        // ex: scheme: "fragments"
        // native: "fragments://redirect"
        // tu peux laisser vide si tu utilises makeRedirectUri par défaut avec ton scheme Expo
    });

const buildProfileFromIdToken = (idToken: string): OAuthProfile => {
    const payload = jwtDecode<GoogleIdTokenPayload>(idToken);
    return {
        provider: "google",
        providerUserId: toProviderUserId(payload.sub),
        email: payload.email,
        emailVerified: payload.email_verified,
        displayName: payload.name,
        avatarUrl: payload.picture,
        locale: payload.locale,
    };
};

const buildTokensFromResponse = (
    tokenResponse: AuthSession.TokenResponse
): AuthTokens => {
    const now = Date.now();
    const expiresInSec = tokenResponse.expiresIn ?? 0;

    return {
        accessToken: tokenResponse.accessToken ?? "",
        idToken: tokenResponse.idToken ?? undefined,
        refreshToken: tokenResponse.refreshToken ?? undefined,
        expiresAt: now + expiresInSec * 1000,
        issuedAt: now,
        tokenType: (tokenResponse.tokenType ?? "Bearer") as "Bearer",
        scope: tokenResponse.scope,
    };
};

export const googleOAuthGateway: OAuthGateway = {
    async startSignIn(provider: ProviderId, opts?: { scopes?: string[] }) {
        if (provider !== "google") {
            throw new Error(`Unsupported provider: ${provider}`);
        }
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            if (isSuccessResponse(response)) {
                console.log("response : ",response.data);
            } else {
                // sign in was cancelled by user
            }
        } catch (error) {
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.IN_PROGRESS:
                        // operation (eg. sign in) already in progress
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        // Android only, play services not available or outdated
                        break;
                    default:
                    // some other error happened
                }
            } else {
                // an error that's not related to google sign in occurred
            }
        }

        // const redirectUri = makeRedirectUri();
        // console.log("redirectUri : ",{redirectUri});
        // const scopes = opts?.scopes ?? ["openid", "email", "profile"];
        //
        // const request = new AuthSession.AuthRequest({
        //     clientId: GOOGLE_CLIENT_ID,
        //     scopes,
        //     redirectUri,
        //     responseType: AuthSession.ResponseType.Code,
        //     extraParams: {
        //         access_type: "offline", // pour avoir un refresh_token
        //         prompt: "consent",      // force la demande (sinon pas toujours de refresh_token)
        //     },
        // });
        //
        // await request.getAuthRequestConfigAsync();
        //
        // const result = await request.promptAsync(discovery);
        // console.log("result : ",{result});
        //
        // if (result.type !== "success" || !result.params.code) {
        //     throw new Error(result.type === "cancel" ? "Sign-in cancelled" : "OAuth error");
        // }
        //
        //
        // const tokenResponse = await AuthSession.exchangeCodeAsync(
        //     {
        //         code: result.params.code,
        //         clientId: GOOGLE_CLIENT_ID,
        //         redirectUri,
        //         extraParams: {
        //             code_verifier: request.codeVerifier!,
        //         },
        //     },
        //     discovery
        // );
        //
        //const tokens = buildTokensFromResponse(tokenResponse);
        const tokens ={} as AuthTokens;
        //
        // if (!tokens.idToken) {
        //     throw new Error("Missing id_token from Google");
        // }
        //
        //const profile = buildProfileFromIdToken(tokens.idToken);
        const profile ={} as OAuthProfile;

        return { profile, tokens };
    },

    async signOut(provider: ProviderId): Promise<void> {
        if (provider !== "google") return;
        // Pour l’instant, on ne révoque pas côté Google (optionnel)
        // Tu pourrais appeler revokeEndpoint avec refresh_token ou access_token si tu veux être hardcore.
    },
};
