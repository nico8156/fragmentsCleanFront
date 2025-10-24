import {CoffeeWlGateway} from "@/app/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import { Coffee } from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {coffeeData} from "@/assets/data/coffeeFromOldServer";
import {coffeeDataConverter} from "@/assets/helpers/coffeeDataConverter";

export class FakeCoffeeGateway implements CoffeeWlGateway {

    willFailGet = false;
    willFailSearch = false;

    nextItems = new Array<Coffee>();
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
        this.nextItems = coffeeData.map(c => coffeeDataConverter(c))
        return { items: this.nextItems as Coffee[]};
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
