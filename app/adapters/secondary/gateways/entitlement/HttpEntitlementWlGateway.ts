import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { EntitlementWlGateway } from "@/app/core-logic/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import { UserEntitlements } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";

type HttpEntitlementWlGatewayDeps = {
	baseUrl: string;
	authToken: AuthTokenBridge;
};

export class HttpEntitlementWlGateway implements EntitlementWlGateway {
	constructor(private readonly deps: HttpEntitlementWlGatewayDeps) {}

	async get({ ifNoneMatch }: { userId: string; ifNoneMatch?: string }) {
		const token = await this.deps.authToken.getAccessToken();
		if (!token) {
			throw new Error("Not authenticated");
		}

		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
		};
		if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;

		const response = await fetch(`${this.deps.baseUrl}/api/users/me/entitlements`, {
			method: "GET",
			headers,
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(`Entitlements get failed with status ${response.status} ${text}`);
		}

		const json = (await response.json()) as {
			userId: string;
			confirmedTickets: number;
			updatedAt?: string;
		};

		return {
			etag: response.headers?.get?.("ETag") ?? undefined,
			data: {
				userId: json.userId,
				confirmedTickets: json.confirmedTickets,
				rights: [],
				updatedAt: json.updatedAt,
			} as UserEntitlements,
		};
	}
}
