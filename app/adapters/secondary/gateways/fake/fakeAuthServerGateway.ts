import { AuthServerGateway } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import { AppUser, AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

export class FakeAuthServerGateway implements AuthServerGateway {
    public refreshed?: AuthSession;
    public refreshedUser?: AppUser;
    public shouldFail = false;

    constructor(private ttlExtensionMs = 60 * 60 * 1000) {}

    async refreshSession(session: AuthSession): Promise<{ session: AuthSession; user?: AppUser }> {
        if (this.shouldFail) throw new Error("refresh failed");
        const refreshed: AuthSession = {
            ...session,
            tokens: {
                ...session.tokens,
                expiresAt: Date.now() + this.ttlExtensionMs,
            },
        };
        this.refreshed = refreshed;
        return {
            session: refreshed,
            user: this.refreshedUser,
        };
    }
}
