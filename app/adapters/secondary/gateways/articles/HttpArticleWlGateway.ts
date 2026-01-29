import type { ArticleWlGateway } from "@/app/core-logic/contextWL/articleWl/gateway/articleWl.gateway";
import type { Article, Locale } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";

type HttpArticleWlGatewayDeps = {
	baseUrl: string; // ex: https://api.fragments.app
};

export class HttpArticleWlGateway implements ArticleWlGateway {
	private readonly baseUrl: string;

	constructor(deps: HttpArticleWlGatewayDeps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
	}

	async getBySlug(input: { slug: string; locale: Locale; ifNoneMatch?: string }) {
		const headers: Record<string, string> = { Accept: "application/json" };
		if (input.ifNoneMatch) headers["If-None-Match"] = input.ifNoneMatch;

		const url = new URL(`${this.baseUrl}/api/articles/${encodeURIComponent(input.slug)}`);
		url.searchParams.set("locale", input.locale);

		const res = await fetch(url.toString(), { headers });

		if (res.status === 304) {
			throw new Error("Not modified");
		}
		if (res.status === 404) {
			throw new Error(`Article not found: ${input.slug}`);
		}
		if (!res.ok) throw new Error(`Article get failed: HTTP ${res.status}`);

		const etag = res.headers.get("ETag") ?? undefined;
		const data = (await res.json()) as Article;

		return { etag, data };
	}

	async list(input: { locale: Locale; limit?: number; cursor?: string }) {
		const headers: Record<string, string> = { Accept: "application/json" };

		const url = new URL(`${this.baseUrl}/api/articles`);
		url.searchParams.set("locale", input.locale);
		if (input.limit !== undefined) url.searchParams.set("limit", String(input.limit));
		if (input.cursor) url.searchParams.set("cursor", input.cursor);

		const res = await fetch(url.toString(), { headers });
		if (!res.ok) throw new Error(`Article list failed: HTTP ${res.status}`);

		const etag = res.headers.get("ETag") ?? undefined;

		// back returns ArticleListView
		const payload = (await res.json()) as {
			items: Article[];
			nextCursor?: string;
			prevCursor?: string;
		};

		return {
			items: payload.items ?? [],
			nextCursor: payload.nextCursor,
			prevCursor: payload.prevCursor,
			etag,
		};
	}
}

