// FakeAuthGateway.ts


import {Tokens, User} from "@/app/store/appState";
import {AuthGateway} from "@/app/core-logic/gateways/authGateway";

export class FakeAuthGateway implements AuthGateway{

    willFail = false;

    public users: Record<string, User> = {
        "google:demo": { id: "u123", email: "demo@example.com", name: "Demo User", avatarUrl: "https://example.com/avatar.png" },
    };

    async signInWithGoogle(): Promise<{ user: User; tokens: Tokens }> {
        // TODO: simuler des erreurs 1/10 pour tester les branches
        await delay(300); // simulate network
        const user = this.users["google:demo"];
        const now = Date.now();
        if (this.willFail) throw new Error("provider_error");
        return {
            user,
            tokens: {
                accessToken: `fake-access-${now}`,
                refreshToken: `fake-refresh-${now}`,
                expiresAt: now + 60 * 60 * 1000, // +1h
            },
        };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
        await delay(150);
        const now = Date.now();
        return { accessToken: `fake-access-${now}`, expiresAt: now + 60 * 60 * 1000 };
    }

    async getUserProfile(accessToken: string): Promise<User> {
        await delay(100);
        // Ici on renvoie l’unique user; en “vrai” on décoderait le token.
        return this.users["google:demo"];
    }
    async getUserProfileWithoutToken(): Promise<User> {
        await delay(100);
        // Ici on renvoie l’unique user; en “vrai” on décoderait le token.
        return this.users["google:demo"];
    }
    // // Optionnel: persistance (à mocker en tests)
    // saveSession(user: User, tokens: Tokens) {
    //     try { localStorage.setItem("auth", JSON.stringify({ user, tokens })); } catch {}
    // }
    // loadSession(): { user: User; tokens: Tokens } | null {
    //     try {
    //         const raw = localStorage.getItem("auth");
    //         return raw ? JSON.parse(raw) : null;
    //     } catch { return null; }
    // }
    // clearSession() {
    //     try { localStorage.removeItem("auth"); } catch {}
    // }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
