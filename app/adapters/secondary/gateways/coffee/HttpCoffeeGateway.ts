import type { CoffeeWlGateway } from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import type { Coffee } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

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
		const data = (await res.json()) as Coffee;

		return { etag, data };
	}

	async getAllSummaries(input?: { ifNoneMatch?: string }) {
		const headers: Record<string, string> = { Accept: "application/json" };
		if (input?.ifNoneMatch) headers["If-None-Match"] = input.ifNoneMatch;

		const res = await fetch(`${this.baseUrl}/api/coffees`, { headers });

		if (res.status === 304) {
			return { etag: input?.ifNoneMatch, items: [] }; // ou une convention “no change”
		}
		if (!res.ok) throw new Error(`Coffee list failed: HTTP ${res.status}`);

		const etag = res.headers.get("ETag") ?? undefined;
		const items = (await res.json()) as Coffee[];

		return { etag, items };
	}

	async search(input: {
		query?: string;
		bbox?: { minLat: number; minLon: number; maxLat: number; maxLon: number };
		city?: string;
		limit?: number;
		cursor?: string;
	}) {
		// ✅ Stratégie simple initiale : client-side search (OK si <1000)
		const { items } = await this.getAllSummaries();
		let out = items;

		if (input.query) {
			const q = input.query.toLowerCase();
			out = out.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					(c.tags ?? []).some((t) => t.toLowerCase().includes(q))
			);
		}
		if (input.city) {
			const city = input.city.toLowerCase();
			out = out.filter((c) => c.address?.city?.toLowerCase() === city);
		}
		if (input.bbox) {
			const b = input.bbox;
			out = out.filter((c) => {
				const { lat, lon } = c.location ?? ({} as any);
				return (
					typeof lat === "number" &&
					typeof lon === "number" &&
					lat >= b.minLat &&
					lat <= b.maxLat &&
					lon >= b.minLon &&
					lon <= b.maxLon
				);
			});
		}

		const limit = input.limit ?? 50;
		out = out.slice(0, limit);

		return { items: out, nextCursor: undefined };
	}
}

