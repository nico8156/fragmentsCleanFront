import { HttpTicketsGateway } from "@/app/adapters/secondary/gateways/ticket/HttpTicketsGateway";
import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";

describe("HttpTicketsGateway", () => {
	const makeResponse = (body: unknown, status = 200) =>
		({
			ok: status >= 200 && status < 300,
			status,
			json: jest.fn(async () => body),
			text: jest.fn(async () => JSON.stringify(body)),
		}) as any;

	it("gets ticket status with bearer auth", async () => {
		const auth = new AuthTokenBridge();
		auth.setSession({
			userId: "user-1",
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
				ticketId: "ticket-1",
				userId: "user-1",
				status: "COMPLETED",
				outcome: "APPROVED",
				imageRef: "local://ticket.png",
				ocrText: "ticket text",
				amountCents: 1230,
				currency: "EUR",
				ticketDate: "2026-07-05T12:00:00Z",
				merchantName: "Cafe Test",
				merchantAddress: "1 rue Test",
				paymentMethod: "CARD",
				rejectionReason: null,
				version: 4,
				occurredAt: "2026-07-06T10:00:00Z",
			}),
		);
		const originalFetch = global.fetch;
		(global as any).fetch = fetcher;

		try {
			const gateway = new HttpTicketsGateway({
				baseUrl: "https://api.example.test",
				auth,
			});

			const result = await gateway.getStatus({ ticketId: "ticket-1" });

			expect(fetcher).toHaveBeenCalledWith(
				"https://api.example.test/api/tickets/ticket-1/status",
				expect.objectContaining({
					method: "GET",
					headers: {
						Authorization: "Bearer mobile-token",
						Accept: "application/json",
					},
				}),
			);
			expect(result).toMatchObject({
				ticketId: "ticket-1",
				status: "COMPLETED",
				outcome: "APPROVED",
				amountCents: 1230,
				version: 4,
				occurredAt: "2026-07-06T10:00:00Z",
			});
		} finally {
			global.fetch = originalFetch;
		}
	});
});
