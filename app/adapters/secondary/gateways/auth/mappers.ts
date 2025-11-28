import {
    AppUser,
    AppUserDTO,
    AuthSession,
    SignInResponseDTO,
    toUserId,
    toIdentityId,
    toProviderUserId,
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
