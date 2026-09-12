import { indexCoffeeMarkers } from "@/app/adapters/primary/react/features/map/coffeeMarkerIndex";

describe("coffee marker index", () => {
	it("resolves marker data by its stable string identity", () => {
		const first = { id: 12, name: "Fragments" };
		const second = { id: "coffee-13", name: "Torréfacteur" };

		const index = indexCoffeeMarkers([first, second]);

		expect(index.get("12")).toBe(first);
		expect(index.get("coffee-13")).toBe(second);
		expect(index.get("missing")).toBeUndefined();
	});
});
