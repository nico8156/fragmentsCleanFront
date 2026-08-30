import {HttpArticleWlGateway} from "@/app/adapters/secondary/gateways/articles/HttpArticleWlGateway";

const article = (id: string) => ({
    id,
    slug: `article-${id}`,
    locale: "fr-FR",
    title: `Article ${id}`,
    intro: "Introduction suffisamment détaillée.",
    blocks: [],
    conclusion: "Conclusion.",
    tags: ["cafe"],
    author: {id: "author-1", name: "Fragments"},
    readingTimeMin: 4,
    publishedAt: "2026-08-30T10:00:00Z",
    updatedAt: "2026-08-30T10:00:00Z",
    version: 1,
    status: "published",
    coffeeIds: [],
});

describe("HttpArticleWlGateway", () => {
    beforeEach(() => jest.restoreAllMocks());

    it("loads every page when requesting the authoritative published snapshot", async () => {
        const fetchMock = jest.spyOn(global, "fetch" as any)
            .mockResolvedValueOnce(new Response(JSON.stringify({items: [article("1")], nextCursor: "100"}), {status: 200}))
            .mockResolvedValueOnce(new Response(JSON.stringify({items: [article("2")]}), {status: 200}));
        const gateway = new HttpArticleWlGateway({baseUrl: "https://backend.test"});

        const result = await gateway.list({locale: "fr-FR"});

        expect(result.items.map((item) => String(item.id))).toEqual(["1", "2"]);
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "https://backend.test/api/articles?locale=fr-FR&limit=100",
            {headers: {Accept: "application/json"}},
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "https://backend.test/api/articles?locale=fr-FR&limit=100&cursor=100",
            {headers: {Accept: "application/json"}},
        );
    });
});
