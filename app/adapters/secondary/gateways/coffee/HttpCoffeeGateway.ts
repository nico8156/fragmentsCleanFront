import type { CoffeeWlGateway } from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import { mapCoffeeSummaryTransport } from "./CoffeeTransportMapper";

type HttpCoffeeGatewayDeps = {
	baseUrl: string; // ex: https://api.fragments.app
};

export class HttpCoffeeGateway implements CoffeeWlGateway {
	private readonly baseUrl: string;

	constructor(deps: HttpCoffeeGatewayDeps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
	}

	async get(input: { id: string; ifNoneMatch?: string }) {
		const headers: Record<string, string> = { Accept: "application/json" };
		if (input.ifNoneMatch) headers["If-None-Match"] = input.ifNoneMatch;

		const res = await fetch(`${this.baseUrl}/api/coffees/${encodeURIComponent(input.id)}`, { headers });

		if (res.status === 304) {
			// à toi de décider quoi faire si cache hit (souvent: throw special / return undefined)
			throw new Error("Not modified");
		}
		if (!res.ok) throw new Error(`Coffee get failed: HTTP ${res.status}`);

		const etag = res.headers.get("ETag") ?? undefined;
		const data = mapCoffeeSummaryTransport(await res.json());

		return { etag, data };
	}

	async getAllSummaries(input?: { ifNoneMatch?: string; limit?: number }) {
		const items = [];
		let cursor: string | undefined;
		let etag: string | undefined;
		do {
			const page = await this.fetchCatalogue({
				limit: input?.limit ?? 100,
				cursor,
				ifNoneMatch: cursor ? undefined : input?.ifNoneMatch,
			});
			if (page.kind === "not-modified") return page;
			items.push(...page.items);
			etag ??= page.etag;
			cursor = page.nextCursor;
		} while (cursor);
		return { kind: "updated" as const, items, etag };
	}

	async search(input: { query?: string; limit?: number; cursor?: string; ifNoneMatch?: string }) {
		return this.fetchCatalogue(input);
	}

	private async fetchCatalogue(input: { query?: string; limit?: number; cursor?: string; ifNoneMatch?: string }) {
		const headers: Record<string, string> = { Accept: "application/json" };
		if (input?.ifNoneMatch) headers["If-None-Match"] = input.ifNoneMatch;
		const params = new URLSearchParams();
		if (input.query) params.set("query", input.query);
		if (input.cursor) params.set("cursor", input.cursor);
		if (input.limit !== undefined) params.set("limit", String(input.limit));
		const serializedParams = params.toString();
		const suffix = serializedParams ? `?${serializedParams}` : "";

		const res = await fetch(`${this.baseUrl}/api/coffees${suffix}`, { headers });

		if (res.status === 304) {
			return { kind: "not-modified" as const, etag: res.headers.get("ETag") ?? input.ifNoneMatch };
		}
		if (!res.ok) throw new Error(`Coffee list failed: HTTP ${res.status}`);

		const etag = res.headers.get("ETag") ?? undefined;
		const payload = await res.json();
		if (!Array.isArray(payload)) throw new Error("Invalid coffee list");
		const items = payload.map(mapCoffeeSummaryTransport);

		return {
			kind: "updated" as const,
			etag,
			items,
			nextCursor: res.headers.get("X-Next-Cursor") ?? undefined,
		};
	}
}
