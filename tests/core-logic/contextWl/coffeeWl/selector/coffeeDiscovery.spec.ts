import { buildCoffeeDiscoveryResults } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import type { Coffee } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

const coffees: Coffee[] = [
    { id: "a", name: "Lumière Café", location: { lat: 48.11, lon: -1.68 }, address: { city: "Rennes" }, tags: ["filtre", "calme"], version: 1, updatedAt: "2026-09-08T00:00:00Z" as any },
    { id: "b", name: "Brûlerie du Centre", location: { lat: 48.09, lon: -1.72 }, address: { city: "Rennes" }, tags: ["espresso"], version: 1, updatedAt: "2026-09-08T00:00:00Z" as any },
    { id: "c", name: "Café Parisien", location: { lat: 48.85, lon: 2.35 }, address: { city: "Paris" }, tags: ["filtre"], version: 1, updatedAt: "2026-09-08T00:00:00Z" as any }
];

const base = {
    coffees,
    photosByCoffeeId: { a: ["https://img/a"], b: [], c: ["https://img/c"] },
    hoursByCoffeeId: {
        a: [{ day: 0 as const, start: 0, end: 0 }],
        b: [{ day: 0 as const, start: 540, end: 600 }]
    },
    hoursStatusByCoffeeId: { a: "ok" as const, b: "ok" as const, c: "error" as const },
    userCoords: { lat: 48.11, lng: -1.68 },
    now: new Date("2026-09-07T10:00:00")
};

describe("coffee geographic discovery", () => {
    it("searches by normalized café name and city from the local public projection", () => {
        const results = buildCoffeeDiscoveryResults({ ...base, discovery: { query: "lumiere", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [], sort: "relevance" } });
        expect(results.map((coffee) => coffee.id)).toEqual(["a"]);

        const byCity = buildCoffeeDiscoveryResults({ ...base, discovery: { query: "paris", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [], sort: "relevance" } });
        expect(byCity.map((coffee) => coffee.id)).toEqual(["c"]);
    });

    it("filters characteristics and only keeps verified open-now cafés", () => {
        const results = buildCoffeeDiscoveryResults({ ...base, discovery: { query: "", onlyOpenNow: true, onlyWithPhotos: true, requiredTags: ["filtre"], sort: "distance" } });
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ id: "a", isOpenNow: true, hasPhoto: true });
    });

    it("sorts by distance when a location is available and remains deterministic without one", () => {
        const nearby = buildCoffeeDiscoveryResults({ ...base, discovery: { query: "", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [], sort: "distance" } });
        expect(nearby.map((coffee) => coffee.id)).toEqual(["a", "b", "c"]);

        const noLocation = buildCoffeeDiscoveryResults({ ...base, userCoords: null, discovery: { query: "", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [], sort: "distance" } });
        expect(noLocation.map((coffee) => coffee.id)).toEqual(["b", "c", "a"]);
    });
});
