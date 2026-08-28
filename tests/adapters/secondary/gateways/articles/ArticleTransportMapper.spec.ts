import {mapArticleTransport} from "@/app/adapters/secondary/gateways/articles/ArticleTransportMapper";

describe("ArticleTransportMapper", () => {
    it("maps the structured public article contract", () => {
        const article = mapArticleTransport({
            id: "article-1", slug: "guide-cafe", locale: "fr-FR", title: "Guide",
            intro: "Introduction", blocks: [{heading: "Goûts", paragraph: "Texte", photo: {url: "https://cdn/image.jpg", width: 800, height: 600, alt: "Café"}}],
            conclusion: "Fin", cover: {url: "https://cdn/cover.jpg", width: 1200, height: 800, alt: "Couverture"},
            tags: ["decouverte"], author: {id: "user-1", name: "Studio"}, readingTimeMin: 5,
            publishedAt: "2026-08-28T10:00:00Z", updatedAt: "2026-08-28T10:00:00Z", version: 2,
            status: "published", coffeeIds: ["coffee-1"]
        });
        expect(article.blocks[0].photo?.url).toBe("https://cdn/image.jpg");
        expect(article.version).toBe(2);
    });

    it("rejects an incomplete backend response instead of casting it", () => {
        expect(() => mapArticleTransport({id: "article-1", status: "published"})).toThrow("Invalid article.slug");
    });
});
