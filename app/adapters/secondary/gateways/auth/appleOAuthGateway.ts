import * as AppleAuthentication from "expo-apple-authentication";
import type { OAuthGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { toProviderUserId } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

const displayName = (name: AppleAuthentication.AppleAuthenticationFullName | null): string | undefined => {
	if (!name) return undefined;
	const value = [name.givenName, name.familyName].filter(Boolean).join(" ").trim();
	return value || undefined;
};

export const appleOAuthGateway: OAuthGateway = {
	async startSignIn(provider) {
		if (provider !== "apple") throw new Error(`Unsupported provider: ${provider}`);
		const available = await AppleAuthentication.isAvailableAsync();
		if (!available) throw new Error("Sign in with Apple is unavailable");
		const result = await AppleAuthentication.signInAsync({
			requestedScopes: [
				AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
				AppleAuthentication.AppleAuthenticationScope.EMAIL,
			],
		});
		if (!result.authorizationCode || !result.identityToken) {
			throw new Error("Incomplete Apple authorization result");
		}
		return {
			profile: {
				provider: "apple",
				providerUserId: toProviderUserId(result.user),
				email: result.email ?? undefined,
				displayName: displayName(result.fullName),
			},
			authorization: {
				authorizationCode: result.authorizationCode,
				idToken: result.identityToken,
			},
		};
	},
	async signOut() {
		// Apple does not expose a device-side sign-out API. Fragments clears its own session.
	},
};
