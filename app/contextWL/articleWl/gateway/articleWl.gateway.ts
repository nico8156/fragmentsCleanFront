import {Article, Locale} from "@/app/contextWL/articleWl/typeAction/article.type";

export interface ArticleWlGateway {
    getBySlug(input: { slug: string; locale: Locale; ifNoneMatch?: string }): Promise<{ data: Article; etag?: string }>;
    list(input: { locale: Locale; limit?: number; cursor?: string }): Promise<{
        items: Article[];
        nextCursor?: string;
        prevCursor?: string;
        etag?: string;
    }>;
}
