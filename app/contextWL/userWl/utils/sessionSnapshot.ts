import {
    AuthSession,
    AuthSessionSnapshot,
} from "@/app/contextWL/userWl/typeAction/user.type";

export const toSessionSnapshot = (session: AuthSession): AuthSessionSnapshot => ({
    ...session,
    tokens: {
        expiresAt: session.tokens.expiresAt,
        issuedAt: session.tokens.issuedAt,
        tokenType: session.tokens.tokenType,
        scope: session.tokens.scope,
    },
});
