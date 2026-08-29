import { mapCoffeeSummaryTransport } from "@/app/adapters/secondary/gateways/coffee/CoffeeTransportMapper";

const publishedCoffee = {
	id: "11111111-1111-1111-1111-111111111111",
	googleId: null,
	name: "Fragments Café",
	location: { lat: 48.117, lon: -1.678 },
	address: { line1: "1 rue du Café", city: "Rennes", postalCode: "35000", country: "FR" },
	phoneNumber: null,
	website: "https://example.test",
	tags: ["espresso", "filter"],
	publicationStatus: "PUBLISHED",
	version: 2,
	updatedAt: "2026-08-29T10:00:00Z",
};

describe("CoffeeTransportMapper", () => {
	it("maps the public published coffee projection", () => {
		const coffee = mapCoffeeSummaryTransport(publishedCoffee);
		expect(coffee).toMatchObject({ id: publishedCoffee.id, name: "Fragments Café", googleId: undefined, phoneNumber: undefined });
		expect(coffee.tags).toEqual(["espresso", "filter"]);
	});

	it("rejects a draft leaked by the public projection", () => {
		expect(() => mapCoffeeSummaryTransport({ ...publishedCoffee, publicationStatus: "DRAFT" }))
			.toThrow("Invalid coffee.publicationStatus");
	});

	it("rejects malformed projection data", () => {
		expect(() => mapCoffeeSummaryTransport({ ...publishedCoffee, location: { lat: "48", lon: -1.678 } }))
			.toThrow("Invalid coffee.location.lat");
	});
});
