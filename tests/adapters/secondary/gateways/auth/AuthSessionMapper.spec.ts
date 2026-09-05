import {
    applyRefreshToSession,
    mapGoogleLoginDtoToSession,
} from "@/app/adapters/secondary/gateways/auth/mappers";

const jwt = (claims: Record<string, unknown>) => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${encode({ alg: "none" })}.${encode(claims)}.`;
};

describe("auth session mapper", () => {
    it("uses the JWT iat and exp claims for a login session", () => {
        const accessToken = jwt({ iat: 1_700_000_000, exp: 1_700_000_900 });
        const session = mapGoogleLoginDtoToSession({
            accessToken,
            refreshToken: "refresh",
            user: { userId: "user-1", displayName: null, email: null, avatarUrl: null },
        }, "google", ["openid"]);

        expect(session.tokens.issuedAt).toBe(1_700_000_000_000);
        expect(session.tokens.expiresAt).toBe(1_700_000_900_000);
    });

    it("uses the refreshed JWT expiration instead of a client-side TTL", () => {
        const previous = mapGoogleLoginDtoToSession({
            accessToken: jwt({ iat: 1_700_000_000, exp: 1_700_000_900 }),
            refreshToken: "refresh-1",
            user: { userId: "user-1", displayName: null, email: null, avatarUrl: null },
        }, "google", ["openid"]);
        const refreshed = applyRefreshToSession(previous, {
            accessToken: jwt({ iat: 1_700_000_800, exp: 1_700_002_000 }),
            refreshToken: "refresh-2",
        });

        expect(refreshed.tokens.issuedAt).toBe(1_700_000_800_000);
        expect(refreshed.tokens.expiresAt).toBe(1_700_002_000_000);
    });

    it("rejects an access token without exp", () => {
        expect(() => mapGoogleLoginDtoToSession({
            accessToken: jwt({ sub: "user-1" }),
            refreshToken: "refresh",
            user: { userId: "user-1", displayName: null, email: null, avatarUrl: null },
        }, "google", [])).toThrow("exp claim is required");
    });
});
