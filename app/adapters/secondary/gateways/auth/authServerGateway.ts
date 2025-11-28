// app/gateways/auth/authServerGateway.http.ts
import Constants from "expo-constants";
import {
    AppUser,
    AuthSession,
    SignInResponseDTO,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { mapSignInDtoToSession, mapUserDtoToDomain } from "./mappers";
import {AuthServerGateway} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string;

export const authServerGateway: AuthServerGateway = {
    async refreshSession(session: AuthSession): Promise<{ session: AuthSession; user?: AppUser }> {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.tokens.refreshToken ?? session.tokens.accessToken}`,
            },
            body: JSON.stringify({
                provider: session.provider,
                userId: session.userId,
                scope: session.tokens.scope,
            }),
        });

        if (!response.ok) {
            throw new Error(`Refresh failed: ${response.status}`);
        }

        const dto = (await response.json()) as SignInResponseDTO;

        const nextSession = mapSignInDtoToSession(dto);
        const user = dto.user ? mapUserDtoToDomain(dto.user) : undefined;

        return { session: nextSession, user };
    },
};
