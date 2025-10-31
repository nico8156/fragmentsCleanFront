import {ArticleWlGateway} from "@/app/core-logic/contextWL/articleWl/gateway/articleWl.gateway";
import {Article, Locale} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";

export class FakeArticleWlGateway implements ArticleWlGateway {
    willFailGet = false;
    willFailList = false;

    readonly store = new Map<string, Article>();
    private readonly listResponses = new Map<Locale, { items: Article[]; nextCursor?: string; prevCursor?: string }>();

    setListResponse(locale: Locale, response: { items: Article[]; nextCursor?: string; prevCursor?: string }) {
        this.listResponses.set(locale, response);
    }

    reset() {
        this.store.clear();
        this.listResponses.clear();
        this.willFailGet = false;
        this.willFailList = false;
    }

    async getBySlug({ slug, locale }: { slug: string; locale: Locale; ifNoneMatch?: string }) {
        if (this.willFailGet) throw new Error("article get failed");
        const article = Array.from(this.store.values()).find(
            (item) => item.slug === slug && item.locale === locale,
        );
        if (!article) {
            throw new Error("article not found");
        }
        return { data: article };
    }

    async list({ locale, limit }: { locale: Locale; limit?: number; cursor?: string }) {
        if (this.willFailList) throw new Error("article list failed");
        const base = this.listResponses.get(locale);
        const itemsSource = base?.items ?? Array.from(this.store.values()).filter((item) => item.locale === locale);
        const items = limit !== undefined ? itemsSource.slice(0, limit) : itemsSource;
        return {
            items,
            nextCursor: base?.nextCursor,
            prevCursor: base?.prevCursor,
        };
    }
}

export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
