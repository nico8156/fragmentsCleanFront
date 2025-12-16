import {
    AppUser,
    AuthSession,
    toUserId,
    AuthTokens, ProviderId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";


const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000; // TODO: aligner avec ton backend
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // optionnel

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
    return {
        userId: toUserId(dto.user.userId),
        tokens: {
            accessToken: dto.accessToken,
            refreshToken: dto.refreshToken,
            idToken: undefined,
            issuedAt: now,
            expiresAt: now + ACCESS_TOKEN_LIFETIME_MS,
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
    const now = Date.now();

    const nextTokens: AuthTokens = {
        ...prev.tokens,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        issuedAt: now,
        expiresAt: now + ACCESS_TOKEN_LIFETIME_MS,
    };

    return {
        ...prev,
        tokens: nextTokens,
    };
};