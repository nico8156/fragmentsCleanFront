import { AuthSecureStore } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

export class FakeAuthSecureStore implements AuthSecureStore {
    private session?: AuthSession;
    public loadError?: Error;
    public saveError?: Error;
    public clearError?: Error;

    async loadSession(): Promise<AuthSession | undefined> {
        if (this.loadError) throw this.loadError;
        return this.session ? { ...this.session } : undefined;
    }

    async saveSession(session: AuthSession): Promise<void> {
        if (this.saveError) throw this.saveError;
        this.session = { ...session };
    }

    async clearSession(): Promise<void> {
        if (this.clearError) throw this.clearError;
        this.session = undefined;
    }

    snapshot() {
        return this.session ? { ...this.session } : undefined;
    }
}
