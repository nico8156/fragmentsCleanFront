import {
	GatewayError,
	toGatewayErrorFromHttpResponse,
	toGatewayErrorFromHttpStatus,
} from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";

describe("gatewayError command rejection contract", () => {
	it("does not interpret an arbitrary 4xx as a business rejection", () => {
		expect(toGatewayErrorFromHttpStatus(400, "bad request")).toMatchObject({
			kind: "unknown",
			status: 400,
		});
	});

	it("recognizes only the typed backend business rejection", async () => {
		const response = {
			status: 422,
			json: async () => ({
				error: "COMMAND_REJECTED",
				reason: "COMMENT_NOT_OWNED",
				message: "Only the author can edit it",
			}),
		} as Response;

		await expect(toGatewayErrorFromHttpResponse(response, "fallback")).resolves.toMatchObject({
			kind: "business",
			status: 422,
			code: "COMMAND_REJECTED",
			reason: "COMMENT_NOT_OWNED",
			message: "Only the author can edit it",
		});
	});

	it("keeps a technical 500 retryable even if its text says rejected", async () => {
		const response = {
			status: 500,
			json: async () => ({ error: "rejected by database" }),
		} as Response;

		const error = await toGatewayErrorFromHttpResponse(response, "request rejected while database is down");
		expect(error).toBeInstanceOf(GatewayError);
		expect(error).toMatchObject({ kind: "server", status: 500 });
	});

	it("does not trust an untyped 422 payload", async () => {
		const response = {
			status: 422,
			json: async () => ({ message: "rejected" }),
		} as Response;

		await expect(toGatewayErrorFromHttpResponse(response, "unprocessable")).resolves.toMatchObject({
			kind: "unknown",
			status: 422,
		});
	});
});
