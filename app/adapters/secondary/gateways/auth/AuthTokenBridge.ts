import {AuthSession, UserId} from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

export class AuthTokenBridge {
    private session?: AuthSession;

    setSession(session?: AuthSession) {
        this.session = session;
    }

    getAccessToken = async (): Promise<string | null> => {
        return this.session?.tokens.accessToken ?? null;
    };

    getCurrentUserId = (): UserId | null => {
        return this.session?.userId ?? null;
    };
}
