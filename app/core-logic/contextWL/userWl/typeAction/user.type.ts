// IDs
export type UserId = string & { readonly __brand: "UserId" };
export type IdentityId = string & { readonly __brand: "IdentityId" };
export type ProviderUserId = string & { readonly __brand: "ProviderUserId" }; // sub Google
export type ProviderId = "google"; // extensible: "apple" | "github" | ...

// Dates & misc (réutilise tes ISODate)
export type ISODate = string & { readonly __brand: "ISODate" };

// Helpers
export const toUserId = (x: string) => x as UserId;
export const toIdentityId = (x: string) => x as IdentityId;
export const toProviderUserId = (x: string) => x as ProviderUserId;

// Ce que l’OAuth Provider garantit / expose
export interface OAuthProfile {
    provider: ProviderId;           // ex: "google"
    providerUserId: ProviderUserId; // "sub" Google
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
    avatarUrl?: string;
    locale?: string;                // "fr", "en"
}

// Compte lié (un App User peut lier plusieurs identities à terme)
export interface LinkedIdentity {
    id: IdentityId;        // id interne
    provider: ProviderId;
    providerUserId: ProviderUserId;
    email?: string;
    createdAt: ISODate;
    lastAuthAt?: ISODate;
}

// Rôles & permissions (simplifié)
export type UserRole = "user" | "moderator" | "admin";

export interface UserPreferences {
    locale?: "fr-FR" | "en-US";
    marketingOptIn?: boolean;
    pushOptIn?: boolean;
    theme?: "light" | "dark" | "system";
}

export interface AppUser {
    id: UserId;
    createdAt: ISODate;
    updatedAt: ISODate;

    // Profil applicatif
    displayName?: string;
    avatarUrl?: string;
    bio?: string;

    // Comptes liés OAuth
    identities: LinkedIdentity[];

    // Contrôles applicatifs
    roles: UserRole[];
    flags?: Record<string, boolean>;   // feature flags côté app
    preferences?: UserPreferences;

    // Métriques/liaisons optionnelles (ex: cafés aimés, etc.) — uniquement ids
    likedCoffeeIds?: string[]; // ou CoffeeId[], si tu préfères
    version: number;           // idempotence
}

// Scopes/claims que l’app demande (dépend du provider)
export interface AuthScope {
    provider: ProviderId;
    scopes: string[]; // ex: ["openid","email","profile"]
}

// Tokens (OPAQUE côté app — pas besoin de parser JWT ici)
export interface AuthTokens {
    accessToken: string;         // court terme
    idToken?: string;            // JWT (facultatif côté client)
    refreshToken?: string;       // à manipuler avec prudence (souvent côté backend)
    expiresAt: number;           // epoch ms
    issuedAt?: number;           // epoch ms
    tokenType?: "Bearer";
    scope?: string;              // echo provider
}

// Session actuelle en mémoire
export interface AuthSession {
    userId: UserId;
    tokens: AuthTokens;
    provider: ProviderId;        // provider source de la session
    scopes: string[];
    establishedAt: number;       // epoch ms
}

export type AuthSessionSnapshot = Omit<AuthSession, "tokens"> & {
    tokens: Pick<AuthTokens, "expiresAt" | "issuedAt" | "tokenType" | "scope">;
};

// État global Auth côté UI (read model)
export type AuthStatus = "signedOut" | "loading" | "signedIn" | "error";

export interface AuthState {
    status: AuthStatus;
    session?: AuthSessionSnapshot;       // présent uniquement si signedIn (tokens tronqués)
    currentUser?: AppUser;       // read model hydraté (peut arriver async après sign-in)
    error?: string;
}

// Ce que ton serveur renverra (exemples)
export interface AppUserDTO {
    id: string;
    createdAt: string;
    updatedAt: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    identities: {
        id: string;
        provider: ProviderId;
        providerUserId: string;
        email?: string;
        createdAt: string;
        lastAuthAt?: string;
    }[];
    roles: UserRole[];
    flags?: Record<string, boolean>;
    preferences?: UserPreferences;
    likedCoffeeIds?: string[];
    version: number;
}

// Une réponse de sign-in server-side (si tu passes par backend plus tard)
export interface SignInResponseDTO {
    user: AppUserDTO;
    tokens: {
        accessToken: string;
        idToken?: string;
        refreshToken?: string;
        expiresAt: number; // epoch ms
        issuedAt?: number;
        tokenType?: "Bearer";
        scope?: string;
    };
    provider: ProviderId;
    scopes: string[];
}
