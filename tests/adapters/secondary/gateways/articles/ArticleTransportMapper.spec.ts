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
        expect(() => mapArticleTransport({id: "article-1", status: "published"})).toThrow("Invalid article.");
    });

    it("accepts the generated article payload exposed by the backend", () => {
        const article = mapArticleTransport({
            id: "53b939ce-f88f-4bcb-9e0f-a48eabea8d23", slug: "decouvrir-le-cafe-de-specialite",
            locale: "fr-FR", title: "Découvrir le café de spécialité",
            intro: "Une exploration guidée du café de spécialité.",
            blocks: [
                {heading: "Comprendre", paragraph: "Un premier regard sur la qualité.", photo: {url: "https://cdn.example/articles/understand.webp", width: 1536, height: 1024, alt: "Grains de café"}},
                {heading: "Déguster", paragraph: "Observer les arômes et les textures.", photo: {url: "https://cdn.example/articles/taste.webp", width: 1536, height: 1024, alt: "Dégustation"}},
                {heading: "Choisir", paragraph: "Identifier une provenance et une torréfaction.", photo: {url: "https://cdn.example/articles/choose.webp", width: 1536, height: 1024, alt: "Producteurs de café"}},
            ],
            conclusion: "Chaque tasse devient une découverte.",
            cover: {url: "https://cdn.example/articles/cover.webp", width: 1536, height: 1024, alt: "Café de spécialité"},
            tags: ["decouverte", "culture-cafe"], author: {id: "fragments-studio", name: "Fragments Studio"},
            readingTimeMin: 5, publishedAt: "2026-08-28T17:31:53.136Z",
            updatedAt: "2026-08-28T17:32:04.250Z", version: 1, status: "published", coffeeIds: [],
        });

        expect(article.blocks).toHaveLength(3);
        expect(article.cover?.url).toContain("cover.webp");
        expect(article.publishedAt).toBe("2026-08-28T17:31:53.136Z");
    });
});
