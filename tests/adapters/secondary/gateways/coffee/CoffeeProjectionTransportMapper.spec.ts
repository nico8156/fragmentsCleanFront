import { mapCoffeePhotos } from "@/app/adapters/secondary/gateways/coffee/CoffeePhotoTransportMapper";
import { mapOpeningHours } from "@/app/adapters/secondary/gateways/coffee/OpeningHoursTransportMapper";

describe("coffee projection transport mappers", () => {
	it("maps valid photo and opening-hours projections", () => {
		expect(mapCoffeePhotos([{ id: "photo-1", coffeeId: "coffee-1", photoUri: "https://cdn.example/photo.webp" }]))
			.toEqual([{ id: "photo-1", coffee_id: "coffee-1", photo_uri: "https://cdn.example/photo.webp" }]);
		expect(mapOpeningHours([{ id: "hours-1", coffeeId: "coffee-1", weekdayDescription: "lundi: 08:00-18:00" }]))
			.toEqual([{ id: "hours-1", coffee_id: "coffee-1", weekday_description: "lundi: 08:00-18:00" }]);
	});

	it.each([
		["photos", () => mapCoffeePhotos([{ id: "photo-1", coffeeId: "coffee-1" }])],
		["opening hours", () => mapOpeningHours([{ id: "hours-1", weekdayDescription: "lundi: 08:00-18:00" }])],
	])("rejects malformed %s instead of manufacturing string values", (_label, map) => {
		expect(map).toThrow(/Invalid/);
	});

	it("rejects non-array transport payloads", () => {
		expect(() => mapCoffeePhotos({ items: [] })).toThrow("expected array");
		expect(() => mapOpeningHours(null)).toThrow("expected array");
	});
});
