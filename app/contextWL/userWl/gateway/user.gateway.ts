import {
    AppUser,
    AuthSession,
    AuthTokens,
    OAuthProfile,
    ProviderId,
    UserId
} from "@/app/contextWL/userWl/typeAction/user.type";

export interface OAuthGateway {
    // Lance le flow OAuth (web/native) et retourne un profil + tokens bruts
    startSignIn(provider: ProviderId, opts?: { scopes?: string[] }): Promise<{
        profile: OAuthProfile;
        tokens: AuthTokens;
    }>;

    // Déconnexion au niveau provider (facultatif selon besoin)
    signOut(provider: ProviderId): Promise<void>;
}

// Persistance secure des tokens/session (SecureStore/Keychain)
export interface AuthSecureStore {
    loadSession(): Promise<AuthSession | undefined>;
    saveSession(session: AuthSession): Promise<void>;
    clearSession(): Promise<void>;
}

// Accès Read du user (depuis ton backend quand il existera)
export interface UserRepo {
    getById(id: UserId): Promise<AppUser | null>;
    // extension: getCurrent() si le backend déduit via token
}
