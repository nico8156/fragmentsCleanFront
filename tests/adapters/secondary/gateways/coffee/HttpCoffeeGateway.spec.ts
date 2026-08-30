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

		expect(global.fetch).toHaveBeenCalledWith("https://backend.test/api/coffees?limit=100", { headers: { Accept: "application/json" } });
		expect(result.kind).toBe("updated");
		if (result.kind !== "updated") throw new Error("expected updated catalogue");
		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({ name: "Projection Café", googleId: undefined });
	});

	it("does not turn a 304 into an empty catalogue", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 304 }));
		const gateway = new HttpCoffeeGateway({ baseUrl: "https://backend.test" });

		await expect(gateway.getAllSummaries({ ifNoneMatch: "catalog-v1" }))
			.resolves.toEqual({ kind: "not-modified", etag: "catalog-v1" });
	});

	it("delegates search and cursor pagination to the backend", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify([responseCoffee]), {
			status: 200,
			headers: { "Content-Type": "application/json", ETag: '"page-v1"', "X-Next-Cursor": "next-page" },
		}));
		const gateway = new HttpCoffeeGateway({ baseUrl: "https://backend.test" });

		const result = await gateway.search({ query: "Rennes", cursor: "page-1", limit: 20 });

		expect(global.fetch).toHaveBeenCalledWith(
			"https://backend.test/api/coffees?query=Rennes&cursor=page-1&limit=20",
			{ headers: { Accept: "application/json" } },
		);
		expect(result).toMatchObject({ kind: "updated", etag: '"page-v1"', nextCursor: "next-page" });
	});

	it("assembles every backend page for the authoritative catalogue snapshot", async () => {
		const secondCoffee = { ...responseCoffee, id: "22222222-2222-2222-2222-222222222222", name: "Second Café" };
		jest.spyOn(global, "fetch")
			.mockResolvedValueOnce(new Response(JSON.stringify([responseCoffee]), {
				status: 200, headers: { "Content-Type": "application/json", ETag: '"catalog-v2"', "X-Next-Cursor": "page-2" },
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([secondCoffee]), {
				status: 200, headers: { "Content-Type": "application/json", ETag: '"catalog-v2"' },
			}));
		const gateway = new HttpCoffeeGateway({ baseUrl: "https://backend.test" });

		const result = await gateway.getAllSummaries({ ifNoneMatch: '"catalog-v1"' });

		expect(global.fetch).toHaveBeenNthCalledWith(1,
			"https://backend.test/api/coffees?limit=100",
			{ headers: { Accept: "application/json", "If-None-Match": '"catalog-v1"' } },
		);
		expect(global.fetch).toHaveBeenNthCalledWith(2,
			"https://backend.test/api/coffees?cursor=page-2&limit=100",
			{ headers: { Accept: "application/json" } },
		);
		expect(result).toMatchObject({ kind: "updated", etag: '"catalog-v2"' });
		if (result.kind !== "updated") throw new Error("expected updated catalogue");
		expect(result.items.map((coffee) => coffee.name)).toEqual(["Projection Café", "Second Café"]);
	});

	it("restarts pagination when the catalogue changes between pages", async () => {
		const secondCoffee = { ...responseCoffee, id: "22222222-2222-2222-2222-222222222222", name: "Second Café" };
		jest.spyOn(global, "fetch")
			.mockResolvedValueOnce(new Response(JSON.stringify([responseCoffee]), {
				status: 200, headers: { "Content-Type": "application/json", ETag: '"catalog-v2"', "X-Next-Cursor": "page-2" },
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([secondCoffee]), {
				status: 200, headers: { "Content-Type": "application/json", ETag: '"catalog-v3"' },
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([secondCoffee]), {
				status: 200, headers: { "Content-Type": "application/json", ETag: '"catalog-v3"' },
			}));
		const gateway = new HttpCoffeeGateway({ baseUrl: "https://backend.test" });

		const result = await gateway.getAllSummaries();

		expect(global.fetch).toHaveBeenCalledTimes(3);
		expect(result).toMatchObject({ kind: "updated", etag: '"catalog-v3"' });
		if (result.kind !== "updated") throw new Error("expected updated catalogue");
		expect(result.items.map((coffee) => coffee.name)).toEqual(["Second Café"]);
	});
});
