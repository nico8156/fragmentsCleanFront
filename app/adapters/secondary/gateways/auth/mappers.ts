import {
    AppUser,
    AppUserDTO,
    AuthSession,
    SignInResponseDTO,
    toUserId,
    toIdentityId,
    toProviderUserId, AuthTokens, ProviderId,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";


export const mapUserDtoToDomain = (dto: AppUserDTO): AppUser => ({
    id: toUserId(dto.id),
    createdAt: dto.createdAt as any,
    updatedAt: dto.updatedAt as any,
    displayName: dto.displayName,
    avatarUrl: dto.avatarUrl,
    bio: dto.bio,
    identities: dto.identities.map((i) => ({
        id: toIdentityId(i.id),
        provider: i.provider,
        providerUserId: toProviderUserId(i.providerUserId),
        email: i.email,
        createdAt: i.createdAt as any,
        lastAuthAt: i.lastAuthAt as any,
    })),
    roles: dto.roles,
    flags: dto.flags,
    preferences: dto.preferences,
    likedCoffeeIds: dto.likedCoffeeIds,
    version: dto.version,
});

export const mapSignInDtoToSession = (dto: SignInResponseDTO): AuthSession => ({
    userId: toUserId(dto.user.id),
    tokens: {
        accessToken: dto.tokens.accessToken,
        idToken: dto.tokens.idToken,
        refreshToken: dto.tokens.refreshToken,
        expiresAt: dto.tokens.expiresAt,
        issuedAt: dto.tokens.issuedAt,
        tokenType: dto.tokens.tokenType,
        scope: dto.tokens.scope,
    },
    provider: dto.provider,
    scopes: dto.scopes,
    establishedAt: Date.now(),
});

const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000; // TODO: aligner avec ton backend
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // optionnel

export interface GoogleLoginResponseDTO {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;          // UUID -> string
        displayName: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
}

export interface RefreshTokenResponseDTO {
    accessToken: string;
    refreshToken: string;
}

export const mapGoogleLoginDtoToSession = (
    dto: GoogleLoginResponseDTO,
    provider: ProviderId,
    scopes: string[]
): AuthSession => {
    const now = Date.now();

    const tokens: AuthTokens = {
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        idToken: undefined,
        issuedAt: now,
        // ⚠️ ici on fait une estimation : idéalement, ton backend renverrait `expiresAt`
        expiresAt: now + ACCESS_TOKEN_LIFETIME_MS,
        tokenType: "Bearer",
        scope: scopes.join(" "),
    };

    return {
        userId: toUserId(dto.user.id),
        tokens,
        provider,
        scopes,
        establishedAt: now,
    };
};
export const mapGoogleUserSummaryToAppUser = (dto: GoogleLoginResponseDTO["user"]): AppUser => {
    const nowIso = new Date().toISOString() as any;
    return {
        id: toUserId(dto.id),
        createdAt: nowIso,
        updatedAt: nowIso,
        displayName: dto.displayName ?? undefined,
        avatarUrl: dto.avatarUrl ?? undefined,
        bio: undefined,
        identities: [],       // on ne les connaît pas encore (ou tu peux peupler avec Google plus tard)
        roles: ["user"],      // safe default
        flags: {},
        preferences: undefined,
        likedCoffeeIds: [],
        version: 0,           // version initiale / optimiste
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