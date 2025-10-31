import * as SecureStore from "expo-secure-store";
import { AuthSecureStore } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

const SESSION_KEY = "app.auth.session";

export class ExpoSecureAuthSessionStore implements AuthSecureStore {
    constructor(private key: string = SESSION_KEY) {}

    async loadSession(): Promise<AuthSession | undefined> {
        const raw = await SecureStore.getItemAsync(this.key);
        if (!raw) return undefined;
        try {
            return JSON.parse(raw) as AuthSession;
        } catch (error) {
            console.warn("Invalid stored session, clearing", error);
            await this.clearSession();
            return undefined;
        }
    }

    async saveSession(session: AuthSession): Promise<void> {
        await SecureStore.setItemAsync(this.key, JSON.stringify(session));
    }

    async clearSession(): Promise<void> {
        await SecureStore.deleteItemAsync(this.key);
    }
}
