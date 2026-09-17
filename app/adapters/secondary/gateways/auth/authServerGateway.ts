import { getJwtSub } from "@/app/adapters/secondary/gateways/auth/authUtils";
import { AuthServerGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { AppUser, AuthSession, ProviderId } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {
	applyRefreshToSession,
	GoogleLoginResponseDTO,
	mapGoogleLoginDtoToSession,
	mapGoogleUserSummaryToAppUser,
	RefreshTokenResponseDTO,
} from "./mappers";

type AuthServerGatewayDeps = {
	baseUrl: string;
};

export const createAuthServerGateway = ({ baseUrl }: AuthServerGatewayDeps): AuthServerGateway => {
	const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");

	return {
		async signInWithProvider(input: {
			provider: ProviderId;
			authorizationCode: string;
			codeVerifier?: string;
			redirectUri?: string;
			idToken?: string | null;
			displayName?: string;
			scopes: string[];
		}): Promise<{ session: AuthSession; user?: AppUser }> {
			const { provider, authorizationCode, codeVerifier, redirectUri, idToken, displayName, scopes } = input;

			const endpoint = provider === "apple" ? "/auth/apple/mobile" : "/auth/google/mobile";
			const body = provider === "apple"
				? { authorizationCode, identityToken: idToken, displayName }
				: { authorizationCode, codeVerifier, redirectUri };
			const response = await fetch(`${normalizedBaseUrl}${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errText = await response.text().catch(() => "");
				throw new Error(`Sign-in failed: ${response.status} ${errText}`);
			}

			const dto = (await response.json()) as GoogleLoginResponseDTO;
			const session = mapGoogleLoginDtoToSession(dto, provider, scopes);

			if (!(session as any).userId) {
				try {
					(session as any).userId = getJwtSub(session.tokens.accessToken);
				} catch (e) {
					console.warn("[AUTH] cannot extract sub from accessToken", e);
				}
			}

			const user = mapGoogleUserSummaryToAppUser(dto.user);
			return { session, user };
		},

		async refreshSession(session: AuthSession): Promise<{ session: AuthSession; user?: AppUser }> {
			const refreshToken = session.tokens.refreshToken;
			if (!refreshToken) throw new Error("No refresh token available for session");

			const response = await fetch(`${normalizedBaseUrl}/auth/refresh`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken }),
			});

			if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);

			const dto = (await response.json()) as RefreshTokenResponseDTO;
			const nextSession = applyRefreshToSession(session, dto);

			if (!(nextSession as any).userId) {
				try {
					(nextSession as any).userId = getJwtSub(nextSession.tokens.accessToken);
				} catch (e) {
					console.warn("[AUTH] cannot extract sub on refresh", e);
				}
			}

			return { session: nextSession, user: undefined };
		},

		async logout(session: AuthSession): Promise<void> {
			const refreshToken = session.tokens.refreshToken;
			if (!refreshToken) return;

			const response = await fetch(`${normalizedBaseUrl}/auth/logout`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken }),
			});
			if (!response.ok) throw new Error(`Logout failed: ${response.status}`);
		},
	};
};
