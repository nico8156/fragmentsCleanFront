import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { EntitlementWlGateway } from "@/app/core-logic/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import {
	PassCounters,
	PassLevel,
	PassLevelSnapshot,
	UserEntitlements,
	UserEntitlementsSnapshot,
} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";
import type { ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

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
			publishedComments?: number;
			confirmedLikes?: number;
			rights?: UserEntitlements["rights"];
			currentLevel?: PassLevel;
			counters?: PassCounters;
			levels?: PassLevelSnapshot[];
			updatedAt?: string;
		};

		const data: UserEntitlementsSnapshot = {
			userId: json.userId,
			confirmedTickets: json.confirmedTickets,
			publishedComments: json.publishedComments,
			confirmedLikes: json.confirmedLikes,
			updatedAt: json.updatedAt as ISODate | undefined,
		};
		if (Array.isArray(json.rights)) data.rights = json.rights;
		if (json.currentLevel || json.counters || Array.isArray(json.levels)) {
			data.pass = {
				currentLevel: json.currentLevel,
				counters: json.counters,
				levels: Array.isArray(json.levels) ? json.levels : undefined,
			};
		}

		return {
			etag: response.headers?.get?.("ETag") ?? undefined,
			data,
		};
	}
}
