import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import {
	OAuthProfile,
	ProviderId,
	toProviderUserId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { OAuthGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {
	GOOGLE_MOBILE_IOS_CLIENT_ID,
	GOOGLE_MOBILE_IOS_REDIRECT_URI,
} from "@/app/adapters/primary/wiring/config";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
	authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

const DEFAULT_GOOGLE_SCOPES = ["openid", "email", "profile"];

const getGoogleOAuthConfig = () => {
	if (!GOOGLE_MOBILE_IOS_CLIENT_ID) {
		throw new Error("[AUTH] Missing Google mobile iOS client id. Set EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID before building/running the app.");
	}
	if (!GOOGLE_MOBILE_IOS_REDIRECT_URI) {
		throw new Error("[AUTH] Missing Google mobile iOS redirect URI. Set EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI before building/running the app.");
	}
	return {
		clientId: GOOGLE_MOBILE_IOS_CLIENT_ID,
		redirectUri: GOOGLE_MOBILE_IOS_REDIRECT_URI,
	};
};

type SuccessfulAuthSessionResult = AuthSession.AuthSessionResult & {
	type: "success";
	params: Record<string, string>;
};

const assertAuthorizationSucceeded = (
	result: AuthSession.AuthSessionResult,
): SuccessfulAuthSessionResult => {
	if (result.type === "cancel" || result.type === "dismiss") {
		throw new Error("Google sign-in cancelled");
	}
	if (result.type !== "success") {
		throw new Error("Google sign-in failed");
	}
	return result as SuccessfulAuthSessionResult;
};

export const googleOAuthGateway: OAuthGateway = {
	async startSignIn(provider: ProviderId, opts?: { scopes?: string[] }) {
		if (provider !== "google") {
			throw new Error(`Unsupported provider: ${provider}`);
		}
		const { clientId, redirectUri } = getGoogleOAuthConfig();

		const request = new AuthSession.AuthRequest({
			clientId,
			redirectUri,
			responseType: AuthSession.ResponseType.Code,
			scopes: opts?.scopes?.length ? opts.scopes : DEFAULT_GOOGLE_SCOPES,
			usePKCE: true,
			extraParams: {
				access_type: "offline",
			},
		});

		const result = assertAuthorizationSucceeded(
			await request.promptAsync(GOOGLE_DISCOVERY),
		);

		const authorizationCode = result.params.code;
		const codeVerifier = request.codeVerifier;

		if (!authorizationCode || !codeVerifier) {
			throw new Error("Google authorization response is incomplete");
		}

		const profile: OAuthProfile = {
			provider: "google",
			providerUserId: toProviderUserId("google-auth-session"),
		};

		return {
			profile,
			authorization: {
				authorizationCode,
				codeVerifier,
				redirectUri,
			},
		};
	},

	async signOut(provider: ProviderId): Promise<void> {
		if (provider !== "google") return;
	},
};
