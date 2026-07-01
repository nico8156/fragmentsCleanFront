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
			idToken?: string | null;
			scopes: string[];
		}): Promise<{ session: AuthSession; user?: AppUser }> {
			const { provider, authorizationCode, scopes } = input;

			if (provider !== "google") throw new Error(`Unsupported provider: ${provider}`);

			const response = await fetch(`${normalizedBaseUrl}/auth/google/exchange`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ authorizationCode }),
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

			try {
				await fetch(`${normalizedBaseUrl}/auth/logout`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken }),
				});
			} catch (e) {
				console.warn("[LOGOUT] backend logout failed", e);
			}
		},
	};
};
