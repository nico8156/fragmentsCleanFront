import { HttpCommentsGateway } from "@/app/adapters/secondary/gateways/comments/HttpCommentsGateway";
import { GatewayError } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";

describe("HttpCommentsGateway moderation contracts", () => {
	const gateway = new HttpCommentsGateway({
		baseUrl: "https://api.example.test/",
		getAccessToken: async () => "access-token",
	});

	afterEach(() => jest.restoreAllMocks());

	it("sends a report through the authenticated social command endpoint", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }));

		await gateway.report({
			commandId: "11111111-1111-4111-8111-111111111111",
			reportId: "22222222-2222-4222-8222-222222222222",
			commentId: "33333333-3333-4333-8333-333333333333",
			reason: "SPAM",
			details: "Repeated promotion",
			at: "2026-09-11T10:00:00Z",
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"https://api.example.test/api/social/comments/33333333-3333-4333-8333-333333333333/reports",
			expect.objectContaining({
				method: "POST",
				headers: { Authorization: "Bearer access-token", "Content-Type": "application/json" },
			}),
		);
		const request = jest.mocked(global.fetch).mock.calls[0][1];
		expect(JSON.parse(String(request?.body))).toMatchObject({ reason: "SPAM", details: "Repeated promotion" });
	});

	it("loads the authoritative blocked-user projection", async () => {
		const blocked = [{ blockId: "b", userId: "u", blockedAt: "2026-09-11T10:00:00Z", version: 1 }];
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify(blocked), {
			status: 200, headers: { "Content-Type": "application/json" },
		}));

		await expect(gateway.listBlockedUsers(new AbortController().signal)).resolves.toEqual(blocked);
		expect(global.fetch).toHaveBeenCalledWith("https://api.example.test/api/social/blocks", expect.objectContaining({
			headers: { Authorization: "Bearer access-token", Accept: "application/json" },
		}));
	});

	it("keeps technical failures retryable through the shared gateway error contract", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

		let thrown: unknown;
		try {
			await gateway.setBlock({ commandId: "c", blockId: "b", blockedUserId: "u", active: true, at: "2026-09-11T10:00:00Z" });
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(GatewayError);
		expect(thrown).toMatchObject({ kind: "server", status: 503 });
	});
});
