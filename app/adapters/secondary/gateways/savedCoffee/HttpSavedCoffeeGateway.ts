import type {
	SavedCoffeeGateway,
	SavedCoffeeSnapshot,
} from "@/app/core-logic/contextWL/savedCoffeeWl/gateway/savedCoffee.gateway";
import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { GatewayError, toGatewayErrorFromHttpStatus } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";

type Deps = {
	baseUrl: string;
	authToken: AuthTokenBridge;
};

export class HttpSavedCoffeeGateway implements SavedCoffeeGateway {
	constructor(private readonly deps: Deps) {}

	async get({ signal }: { signal: AbortSignal }): Promise<SavedCoffeeSnapshot> {
		const token = await this.deps.authToken.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");

		const res = await fetch(`${this.deps.baseUrl}/api/users/me/saved-coffees`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
			signal,
		});

		if (!res.ok) {
			throw toGatewayErrorFromHttpStatus(res.status, `Saved coffees get failed with status ${res.status}`);
		}

		const json = await res.json() as SavedCoffeeSnapshot;
		return {
			items: json.items ?? [],
			version: json.version ?? 0,
			serverTime: json.serverTime,
		};
	}

	async set(input: {
		commandId: string;
		savedCoffeeId: string;
		coffeeId: string;
		value: boolean;
		at: string;
	}): Promise<void> {
		const token = await this.deps.authToken.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");

		const res = await fetch(`${this.deps.baseUrl}/api/users/me/saved-coffees`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});

		if (!res.ok && res.status !== 202 && res.status !== 204) {
			throw toGatewayErrorFromHttpStatus(res.status, `Saved coffee set failed with status ${res.status}`);
		}
	}
}
