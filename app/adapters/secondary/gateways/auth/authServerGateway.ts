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

        const response = await fetch(`http://192.168.1.16:8080/auth/google/exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                authorizationCode,
            }),
        });

        if (!response.ok) {
            throw new Error(`Sign-in failed: ${response.status}`);
        }

        const dto = (await response.json()) as GoogleLoginResponseDTO;

        const session = mapGoogleLoginDtoToSession(dto, provider, scopes);

        // 👉 option 1 : on construit un AppUser minimal à partir du summary
        const user = mapGoogleUserSummaryToAppUser(dto.user);

        // 👉 option 2 : si tu préfères passer par ton read model,
        // tu peux simplement retourner { session } et laisser authUserHydrationRequested
        // aller chercher le user complet plus tard.

        return { session, user };
    },

    async refreshSession(session: AuthSession): Promise<{ session: AuthSession; user?: AppUser }> {
        const refreshToken = session.tokens.refreshToken;

        if (!refreshToken) {
            throw new Error("No refresh token available for session");
        }

        const response = await fetch(`http://192.168.1.16:8080/auth/refresh`, {
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

        // Le backend ne renvoie pas de user ici -> pas de changement de currentUser
        return { session: nextSession, user: undefined };
    },
    async logout(session: AuthSession): Promise<void> {
        const refreshToken = session.tokens.refreshToken;
        if (!refreshToken) {
            return; // rien à faire, on laisse tomber silencieusement
        }

        try {
            await fetch(`http://192.168.1.16:8080/auth/logout`, {
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

