export type GatewayErrorKind =
	| "network"
	| "auth"
	| "business"
	| "server"
	| "unknown";

export class GatewayError extends Error {
	readonly kind: GatewayErrorKind;
	readonly status?: number;
	readonly code?: string;
	readonly reason?: string;

	constructor(kind: GatewayErrorKind, message: string, status?: number, code?: string, reason?: string) {
		super(message);
		this.name = "GatewayError";
		this.kind = kind;
		this.status = status;
		this.code = code;
		this.reason = reason;
	}
}

export const isGatewayError = (error: unknown): error is GatewayError =>
	error instanceof GatewayError ||
		((error as any)?.name === "GatewayError" && typeof (error as any)?.kind === "string");

export const toGatewayErrorFromHttpStatus = (
	status: number,
	message: string,
): GatewayError => {
	if (status === 401 || status === 403) return new GatewayError("auth", message, status);
	if (status >= 500 || status === 408 || status === 429) return new GatewayError("server", message, status);
	if (status >= 400 && status < 500) return new GatewayError("unknown", message, status);
	return new GatewayError("unknown", message, status);
};

type CommandErrorPayload = {
	error?: unknown;
	reason?: unknown;
	message?: unknown;
};

const isExplicitCommandRejection = (status: number, error: unknown) =>
	(status === 422 && error === "COMMAND_REJECTED") ||
	(status === 409 && error === "COMMAND_ID_CONFLICT");

export const toGatewayErrorFromHttpResponse = async (
	response: Response,
	fallbackMessage: string,
): Promise<GatewayError> => {
	let payload: CommandErrorPayload | undefined;
	try {
		payload = await response.json() as CommandErrorPayload;
	} catch {
		payload = undefined;
	}

	if (isExplicitCommandRejection(response.status, payload?.error)) {
		const code = String(payload?.error);
		const reason = typeof payload?.reason === "string" ? payload.reason : undefined;
		const message = typeof payload?.message === "string" ? payload.message : fallbackMessage;
		return new GatewayError("business", message, response.status, code, reason);
	}

	return toGatewayErrorFromHttpStatus(response.status, fallbackMessage);
};

export const toNetworkGatewayError = (message: string) =>
	new GatewayError("network", message);
