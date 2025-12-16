import Constants from "expo-constants";
import {
    AppUser,
    AuthSession, ProviderId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import {
    applyRefreshToSession,
    GoogleLoginResponseDTO,
    mapGoogleLoginDtoToSession,
    mapGoogleUserSummaryToAppUser, RefreshTokenResponseDTO,
} from "./mappers";
import {AuthServerGateway} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import {getJwtSub} from "@/app/adapters/secondary/gateways/auth/authUtils";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string;
console.log("API_BASE_URL", API_BASE_URL);


export const authServerGateway: AuthServerGateway = {
    async signInWithProvider(input: {
        provider: ProviderId;
        authorizationCode: string;
        idToken?: string | null;
        scopes: string[];
    }): Promise<{ session: AuthSession; user?: AppUser }> {


        const { provider, authorizationCode, scopes } = input;

        if (provider !== "google") {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        const response = await fetch(`${API_BASE_URL}/auth/google/exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                authorizationCode,
            }),
        });
        if (!response.ok) {
            const errText = await response.text().catch(() => "");
            throw new Error(`Sign-in failed: ${response.status} ${errText}`);
        }

        console.log("[AUTH] signInWithProvider res", {
            status: response.status,
            contentType: response.headers.get("content-type"),
        });

        const dto = (await response.json()) as GoogleLoginResponseDTO;

        const session = mapGoogleLoginDtoToSession(dto, provider, scopes);

// ✅ IMPORTANT : userId = sub du JWT app
        try {
            const sub = getJwtSub(session.tokens.accessToken);
            (session as any).userId = sub; // ou session.userId = sub as UserId
        } catch (e) {
            console.warn("[AUTH] cannot extract sub from accessToken", e);
        }

        const user = mapGoogleUserSummaryToAppUser(dto.user);

        return { session, user };
    },

    async refreshSession(session: AuthSession): Promise<{ session: AuthSession; user?: AppUser }> {
        const refreshToken = session.tokens.refreshToken;

        if (!refreshToken) {
            throw new Error("No refresh token available for session");
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Refresh failed: ${response.status}`);
        }

        const dto = (await response.json()) as RefreshTokenResponseDTO;

        const nextSession = applyRefreshToSession(session, dto);
        try {
            const sub = getJwtSub(nextSession.tokens.accessToken);
            (nextSession as any).userId = sub;
        } catch (e) {
            console.warn("[AUTH] cannot extract sub on refresh", e);
        }

        return { session: nextSession, user: undefined };
    },

    async logout(session: AuthSession): Promise<void> {
        const refreshToken = session.tokens.refreshToken;
        if (!refreshToken) {
            return; // rien à faire, on laisse tomber silencieusement
        }

        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
        } catch (e) {
            // on ne casse pas le logout côté UI pour ça
            console.warn("[LOGOUT] backend logout failed", e);
        }
    }
};

