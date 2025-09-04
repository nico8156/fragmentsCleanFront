import {Tokens, User} from "@/app/store/appState";

export interface AuthGateway {
    signInWithGoogle(): Promise<{ user: User; tokens: Tokens }>;
    refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }>;
    getUserProfile(accessToken: string): Promise<User>;
    getUserProfileWithoutToken(): Promise<User>;
    logout(): Promise<void>;
}