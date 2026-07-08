export type GatewayErrorKind =
	| "network"
	| "auth"
	| "business"
	| "server"
	| "unknown";

export class GatewayError extends Error {
	readonly kind: GatewayErrorKind;
	readonly status?: number;

	constructor(kind: GatewayErrorKind, message: string, status?: number) {
		super(message);
		this.name = "GatewayError";
		this.kind = kind;
		this.status = status;
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
	if (status >= 400 && status < 500) return new GatewayError("business", message, status);
	return new GatewayError("unknown", message, status);
};

export const toNetworkGatewayError = (message: string) =>
	new GatewayError("network", message);
