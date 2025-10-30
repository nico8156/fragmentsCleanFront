import {ArticleWlGateway} from "@/app/contextWL/articleWl/gateway/articleWl.gateway";
import {Article, Locale} from "@/app/contextWL/articleWl/typeAction/article.type";
import {specialtyArticles} from "@/assets/data/articles";

const sortByMostRecent = (items: Article[]) =>
    [...items].sort((a, b) => {
        const aDate = a.publishedAt ?? a.updatedAt;
        const bDate = b.publishedAt ?? b.updatedAt;
        return bDate.localeCompare(aDate);
    });

export class StaticArticleWlGateway implements ArticleWlGateway {
    private readonly store = specialtyArticles;

    async getBySlug({ slug, locale }: { slug: string; locale: Locale; ifNoneMatch?: string }) {
        const article = this.store.find((item) => item.slug === slug && item.locale === locale);
        if (!article) {
            throw new Error(`article with slug "${slug}" not found`);
        }
        return { data: article };
    }

    async list({ locale, limit }: { locale: Locale; limit?: number; cursor?: string }) {
        const filtered = this.store.filter((article) => article.locale === locale);
        const ordered = sortByMostRecent(filtered);
        const items = limit !== undefined ? ordered.slice(0, limit) : ordered;
        return {
            items,
        };
    }
}
