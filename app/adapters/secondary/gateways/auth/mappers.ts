import {
    AppUser,
    AuthSession,
    toUserId,
    AuthTokens, ProviderId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { jwtDecode } from "jwt-decode";

type JwtTimingClaims = { exp?: number; iat?: number };

const tokenTiming = (accessToken: string, now = Date.now()) => {
    let claims: JwtTimingClaims;
    try {
        claims = jwtDecode<JwtTimingClaims>(accessToken);
    } catch {
        throw new Error("Invalid access token: JWT payload cannot be decoded");
    }
    if (!Number.isFinite(claims.exp)) {
        throw new Error("Invalid access token: exp claim is required");
    }
    return {
        issuedAt: Number.isFinite(claims.iat) ? Number(claims.iat) * 1000 : now,
        expiresAt: Number(claims.exp) * 1000,
    };
};

export interface GoogleLoginResponseDTO {
    accessToken: string;
    refreshToken: string;
    user: {
        userId: string;
        displayName: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
}


export interface RefreshTokenResponseDTO {
    accessToken: string;
    refreshToken: string;
}

export const mapGoogleLoginDtoToSession = (dto: GoogleLoginResponseDTO, provider: ProviderId, scopes: string[]): AuthSession => {
    const now = Date.now();
    const timing = tokenTiming(dto.accessToken, now);
    return {
        userId: toUserId(dto.user.userId),
        tokens: {
            accessToken: dto.accessToken,
            refreshToken: dto.refreshToken,
            idToken: undefined,
            issuedAt: timing.issuedAt,
            expiresAt: timing.expiresAt,
            tokenType: "Bearer",
            scope: scopes.join(" "),
        },
        provider,
        scopes,
        establishedAt: now,
    };
};

export const mapGoogleUserSummaryToAppUser = (dto: GoogleLoginResponseDTO["user"]): AppUser => {
    const nowIso = new Date().toISOString() as any;
    return {
        id: toUserId(dto.userId),
        createdAt: nowIso,
        updatedAt: nowIso,
        displayName: dto.displayName ?? undefined,
        avatarUrl: dto.avatarUrl ?? undefined,
        bio: undefined,
        identities: [],
        roles: ["user"],
        flags: {},
        preferences: undefined,
        likedCoffeeIds: [],
        version: 0,
    };
};


export const applyRefreshToSession = (
    prev: AuthSession,
    dto: RefreshTokenResponseDTO
): AuthSession => {
    const timing = tokenTiming(dto.accessToken);

    const nextTokens: AuthTokens = {
        ...prev.tokens,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        issuedAt: timing.issuedAt,
        expiresAt: timing.expiresAt,
    };

    return {
        ...prev,
        tokens: nextTokens,
    };
};
