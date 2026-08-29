import { HttpCoffeeGateway } from "@/app/adapters/secondary/gateways/coffee/HttpCoffeeGateway";

const responseCoffee = {
	id: "11111111-1111-1111-1111-111111111111", googleId: null, name: "Projection Café",
	location: { lat: 48.117, lon: -1.678 },
	address: { line1: null, city: "Rennes", postalCode: "35000", country: "FR" },
	phoneNumber: null, website: null, tags: [], publicationStatus: "PUBLISHED",
	version: 1, updatedAt: "2026-08-29T10:00:00Z",
};

describe("HttpCoffeeGateway", () => {
	afterEach(() => jest.restoreAllMocks());

	it("maps only the public projection response", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify([responseCoffee]), {
			status: 200, headers: { "Content-Type": "application/json" },
		}));
		const gateway = new HttpCoffeeGateway({ baseUrl: "https://backend.test" });

		const result = await gateway.getAllSummaries();

		expect(global.fetch).toHaveBeenCalledWith("https://backend.test/api/coffees", { headers: { Accept: "application/json" } });
		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({ name: "Projection Café", googleId: undefined });
	});

	it("does not turn a 304 into an empty catalogue", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 304 }));
		const gateway = new HttpCoffeeGateway({ baseUrl: "https://backend.test" });

		await expect(gateway.getAllSummaries({ ifNoneMatch: "catalog-v1" }))
			.rejects.toThrow("Coffee list not modified");
	});
});
