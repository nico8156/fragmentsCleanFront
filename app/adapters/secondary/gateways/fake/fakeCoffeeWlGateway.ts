import {CoffeeWlGateway} from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import { Coffee } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export class FakeCoffeeGateway implements CoffeeWlGateway {

    willFailGet = false;
    willFailSearch = false;

    nextItems = new Array<Coffee>();
    listCalls = 0;
    store = new Map<string, Coffee>();
    nextCursor?: string;

    async get({ id }: { id: string }) {
        if (this.willFailGet) throw new Error("coffee get failed");
        const data = this.store.get(id);
        if (!data) throw new Error("coffee not found");
        return { data, etag: undefined };
    }
    async getAllSummaries(input?: { ifNoneMatch?: string; }): Promise<{ etag?: string; items: Coffee[]; }> {
        if (this.willFailGet) throw new Error("coffee get failed");
        this.listCalls++;
        return { items: [...this.nextItems] };
    }

    async search({ query, bbox, city, limit = 50 }: any) {
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
        if (city) {
            const c = String(city).toLowerCase();
            items = items.filter((x) => x.address?.city?.toLowerCase() === c);
        }
        if (bbox) {
            items = items.filter((x) => {
                if (!x.location) return false;
                const { lat, lon } = x.location;
                return lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon;
            });
        }
        items = items.slice(0, limit);
        return { items, nextCursor: this.nextCursor };
    }
}
