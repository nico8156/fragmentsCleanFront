import { HttpCommandStatusGateway } from "@/app/adapters/secondary/gateways/outbox/HttpCommandStatusGateway";
import { FakeAuthTokenBridge } from "@/tests/core-logic/fakes/FakeAuthTokenBridge";

describe("HttpCommandStatusGateway", () => {
	afterEach(() => jest.restoreAllMocks());

	it("maps the canonical rejection code", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				status: "REJECTED",
				rejectedAt: "2026-09-11T10:00:00Z",
				rejectionCode: "COMMENT_NOT_OWNED",
				reason: "Only the author can edit it",
			}),
		} as Response);
		const gateway = new HttpCommandStatusGateway({
			baseUrl: "https://api.example.test",
			authToken: new FakeAuthTokenBridge("access-token", "user-id") as any,
		});

		await expect(gateway.getStatus("command-id")).resolves.toEqual({
			status: "REJECTED",
			rejectedAt: "2026-09-11T10:00:00Z",
			rejectionCode: "COMMENT_NOT_OWNED",
			reason: "Only the author can edit it",
		});
	});
});
