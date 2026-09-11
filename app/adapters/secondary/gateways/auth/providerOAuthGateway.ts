import type { OAuthGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { appleOAuthGateway } from "./appleOAuthGateway";
import { googleOAuthGateway } from "./googleOAuthGateway";

export const providerOAuthGateway: OAuthGateway = {
	startSignIn(provider, options) {
		return provider === "apple"
			? appleOAuthGateway.startSignIn(provider, options)
			: googleOAuthGateway.startSignIn(provider, options);
	},
	signOut(provider) {
		return provider === "apple" ? appleOAuthGateway.signOut(provider) : googleOAuthGateway.signOut(provider);
	},
};
