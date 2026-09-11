import { HttpLikesGateway } from "@/app/adapters/secondary/gateways/like/HttpLikesGateway";
import { GatewayError } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";
import { FakeAuthTokenBridge } from "@/tests/core-logic/fakes/FakeAuthTokenBridge";

jest.mock("@/app/adapters/secondary/gateways/like/helpers/likeId", () => ({
	computeLikeId: () => "55555555-5555-4555-8555-555555555555",
}));

describe("HttpLikesGateway command error contract", () => {
	const authToken = new FakeAuthTokenBridge("access-token", "11111111-1111-4111-8111-111111111111");
	const gateway = new HttpLikesGateway({ baseUrl: "https://api.example.test", authToken: authToken as any });

	afterEach(() => jest.restoreAllMocks());

	it("turns a typed backend rejection into an explicit business error", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue({
			ok: false,
			status: 422,
			json: async () => ({
				error: "COMMAND_REJECTED",
				reason: "LIKE_ID_CONFLICT",
				message: "Like id belongs to another user or target",
			}),
		} as Response);

		await expect(gateway.add({
			commandId: "22222222-2222-4222-8222-222222222222",
			targetId: "33333333-3333-4333-8333-333333333333",
			at: "2026-09-11T10:00:00Z",
		})).rejects.toMatchObject({
			name: "GatewayError",
			kind: "business",
			status: 422,
			code: "COMMAND_REJECTED",
			reason: "LIKE_ID_CONFLICT",
		});
	});

	it("keeps an untyped client error non-terminal", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({ message: "rejected" }),
		} as Response);

		let thrown: unknown;
		try {
			await gateway.remove({
				commandId: "44444444-4444-4444-8444-444444444444",
				targetId: "33333333-3333-4333-8333-333333333333",
				at: "2026-09-11T10:00:00Z",
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(GatewayError);
		expect(thrown).toMatchObject({ kind: "unknown", status: 400 });
	});
});
