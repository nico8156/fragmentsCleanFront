import {CoffeeWlGateway} from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import { Coffee } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export class FakeCoffeeGateway implements CoffeeWlGateway {

    willFailGet = false;
    willFailSearch = false;

    nextItems = new Array<Coffee>();
    listCalls = 0;
    store = new Map<string, Coffee>();
    nextCursor?: string;
	nextListNotModified = false;
	nextDetailNotModified = false;
	lastListInput?: { ifNoneMatch?: string; limit?: number };
	lastDetailInput?: { id: string; ifNoneMatch?: string };

	async get({ id, ifNoneMatch }: { id: string; ifNoneMatch?: string }) {
		this.lastDetailInput = { id, ifNoneMatch };
		if (this.willFailGet) throw new Error("coffee get failed");
		if (this.nextDetailNotModified) return { kind: "not-modified" as const, etag: ifNoneMatch ?? "fake-detail" };
		const data = this.store.get(id);
		if (!data) throw new Error("coffee not found");
		return { kind: "updated" as const, data, etag: "fake-detail" };
    }
	async getAllSummaries(input?: { ifNoneMatch?: string; limit?: number }) {
        if (this.willFailGet) throw new Error("coffee get failed");
        this.listCalls++;
		this.lastListInput = input;
		if (this.nextListNotModified) return { kind: "not-modified" as const, etag: input?.ifNoneMatch };
		return { kind: "updated" as const, items: [...this.nextItems], etag: "fake-catalogue" };
    }

	async search({ query, limit = 50 }: any) {
        if (this.willFailSearch) throw new Error("coffee search failed");
        let items = Array.from(this.store.values());

        if (query) {
            const q = String(query).toLowerCase();
            items = items.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
            );
        }
		items = items.slice(0, limit);
		return { kind: "updated" as const, items, nextCursor: this.nextCursor };
    }
}
