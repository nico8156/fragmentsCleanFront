import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { HttpEntitlementWlGateway } from "@/app/adapters/secondary/gateways/entitlement/HttpEntitlementWlGateway";

describe("HttpEntitlementWlGateway", () => {
	const makeResponse = (body: unknown, status = 200) =>
		({
			ok: status >= 200 && status < 300,
			status,
			json: jest.fn(async () => body),
			text: jest.fn(async () => JSON.stringify(body)),
			headers: {
				get: jest.fn((name: string) => (name === "ETag" ? '"entitlements-7"' : undefined)),
			},
		}) as any;

	it("gets current user entitlements with bearer auth", async () => {
		const authToken = new AuthTokenBridge();
		authToken.setSession({
			userId: "user-42",
			provider: "google",
			scopes: ["openid"],
			establishedAt: 0,
			tokens: {
				accessToken: "mobile-token",
				refreshToken: "refresh-token",
				expiresAt: Date.now() + 60_000,
			},
		} as any);

		const fetcher = jest.fn(async () =>
			makeResponse({
				userId: "user-42",
				confirmedTickets: 5,
				publishedComments: 3,
				confirmedLikes: 1,
				rights: ["COMMENT"],
				currentLevel: "SOCIAL_BEAN",
				counters: {
					validatedTickets: 5,
					publishedComments: 3,
					confirmedLikes: 1,
				},
				levels: [
					{
						level: "COFFEE_TASTER",
						status: "COMPLETED",
						requirements: { validatedTickets: 3 },
						unlockedCapabilities: ["SCAN"],
					},
					{
						level: "URBAN_EXPLORER",
						status: "COMPLETED",
						requirements: { validatedTickets: 5, publishedComments: 3 },
						unlockedCapabilities: ["COMMENT"],
					},
					{
						level: "SOCIAL_BEAN",
						status: "IN_PROGRESS",
						requirements: { validatedTickets: 10, publishedComments: 5, confirmedLikes: 5 },
						unlockedCapabilities: ["LIKE"],
					},
				],
				version: 8,
				updatedAt: "2026-07-06T12:00:00.000Z",
				serverTime: "2026-07-06T12:00:01.000Z",
			}),
		);
		const originalFetch = global.fetch;
		(global as any).fetch = fetcher;

		try {
			const gateway = new HttpEntitlementWlGateway({
				baseUrl: "https://api.example.test",
				authToken,
			});

			const result = await gateway.get({ userId: "user-42", ifNoneMatch: '"old"' });

			expect(fetcher).toHaveBeenCalledWith(
				"https://api.example.test/api/users/me/entitlements",
				expect.objectContaining({
					method: "GET",
					headers: {
						Authorization: "Bearer mobile-token",
						Accept: "application/json",
						"If-None-Match": '"old"',
					},
				}),
			);
			expect(result).toMatchObject({
				etag: '"entitlements-7"',
				data: {
					userId: "user-42",
					confirmedTickets: 5,
					publishedComments: 3,
					confirmedLikes: 1,
					rights: ["COMMENT"],
					pass: {
						currentLevel: "SOCIAL_BEAN",
						counters: {
							validatedTickets: 5,
							publishedComments: 3,
							confirmedLikes: 1,
						},
					},
					updatedAt: "2026-07-06T12:00:00.000Z",
				},
			});
		} finally {
			global.fetch = originalFetch;
		}
	});
});
