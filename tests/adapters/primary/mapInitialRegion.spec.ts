import { resolveInitialMapCenter } from "@/app/adapters/primary/react/features/map/mapInitialRegion";

describe("initial coffee map center", () => {
	it("prefers the user, then the visible catalogue, before the neutral fallback", () => {
		const paris = { lat: 48.8566, lng: 2.3522 };
		const rennesCoffee = { lat: 48.1173, lon: -1.6778 };
		expect(resolveInitialMapCenter({ userCoords: { lat: 48.12, lng: -1.68 }, firstCoffee: rennesCoffee, fallback: paris })).toEqual({ lat: 48.12, lng: -1.68 });
		expect(resolveInitialMapCenter({ firstCoffee: rennesCoffee, fallback: paris })).toEqual({ lat: 48.1173, lng: -1.6778 });
		expect(resolveInitialMapCenter({ fallback: paris })).toEqual(paris);
	});
});
