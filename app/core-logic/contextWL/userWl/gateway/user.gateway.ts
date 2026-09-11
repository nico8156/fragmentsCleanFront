import {
    AppUser,
    AuthSession,
    OAuthProfile,
    ProviderAuthorizationResult,
    ProviderId,
    UserId
} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import type { LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

export interface OAuthGateway {
    // Lance le flow OAuth (web/native) et retourne le code d'autorisation provider.
    startSignIn(provider: ProviderId, opts?: { scopes?: string[] }): Promise<{
        profile: OAuthProfile;
        authorization: ProviderAuthorizationResult;
    }>;

    // Déconnexion au niveau provider (facultatif selon besoin)
    signOut(provider: ProviderId): Promise<void>;
    // tres bien mais on veut du oauth2 with pkce ;)
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
	updateProfile(input: { commandId: string; displayName: string }): Promise<void>;
	uploadAvatar(input: { commandId: string; mediaId: string; image: LocalImageInput; at: string }): Promise<void>;
	removeAvatar(input: { commandId: string; at: string }): Promise<void>;
	requestAccountDeletion(input: { commandId: string }): Promise<void>;
}

export interface AuthServerGateway {
    signInWithProvider(input: {
        provider: ProviderId;
        authorizationCode: string;
		codeVerifier?: string;
		redirectUri?: string;
        idToken?: string | null;
		displayName?: string;
        scopes: string[];
    }): Promise<{
        session: AuthSession;
        user?: AppUser;
    }>;
    refreshSession(session: AuthSession): Promise<{
        session: AuthSession;
        user?: AppUser;
    }>;
    logout(session: AuthSession): Promise<void>;

    //prevoir
}
