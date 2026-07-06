import { createAuthServerGateway } from "@/app/adapters/secondary/gateways/auth/authServerGateway";

describe("createAuthServerGateway", () => {
	const originalFetch = global.fetch;
	const jwtForUser = "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.";

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it("posts Google mobile PKCE authorization to /auth/google/mobile", async () => {
		const fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				accessToken: jwtForUser,
				refreshToken: "app-refresh-token",
				user: {
					id: "11111111-1111-4111-8111-111111111111",
					displayName: "User Test",
					email: "user@example.com",
					avatarUrl: null,
				},
			}),
		});
		global.fetch = fetchMock as any;

		const gateway = createAuthServerGateway({
			baseUrl: "https://api.fragments.test/",
		});

		await gateway.signInWithProvider({
			provider: "google",
			authorizationCode: "auth-code-123",
			codeVerifier: "verifier-123",
			redirectUri: "com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect",
			scopes: ["openid", "email", "profile"],
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.fragments.test/auth/google/mobile",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					authorizationCode: "auth-code-123",
					codeVerifier: "verifier-123",
					redirectUri: "com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect",
				}),
			}),
		);
	});
});
