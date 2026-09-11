import { HttpExperienceGateway } from "@/app/adapters/secondary/gateways/experiences/HttpExperienceGateway";

describe("HttpExperienceGateway", () => {
	afterEach(() => jest.restoreAllMocks());
	it("maps the transport read model explicitly", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ items: [{ experienceId: "e", coffeeId: "c", authorId: "u", authorName: "Nicolas", message: "Visite", publicationStatus: "PUBLISHED", moderationStatus: "VISIBLE", createdAt: "2026-09-11T10:00:00Z", updatedAt: "2026-09-11T10:00:00Z", version: 2 }], nextCursor: null }), { status: 200 }));
		const gateway = new HttpExperienceGateway({ baseUrl: "https://api.test", getAccessToken: async () => "token" });
		await expect(gateway.listCoffee({ coffeeId: "c", signal: new AbortController().signal })).resolves.toMatchObject({ items: [{ experienceId: "e", userId: "u", status: "PUBLISHED", version: 2 }] });
		expect(fetch).toHaveBeenCalledWith("https://api.test/api/coffees/c/experiences?", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
	});

	it("publishes a text experience without any ticket field", async () => {
		const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
		const gateway = new HttpExperienceGateway({ baseUrl: "https://api.test", getAccessToken: async () => "token" });
		await gateway.create({ commandId: "cmd", experienceId: "e", coffeeId: "c", message: "Visite", publicationStatus: "PUBLISHED", at: "2026-09-11T10:00:00Z" });
		const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
		expect(body).not.toHaveProperty("ticketId");
		expect(body).toMatchObject({ experienceId: "e", publicationStatus: "PUBLISHED" });
	});
});
