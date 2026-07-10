import type { ImageRef } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import type {
	StudioArticleDraft,
	StudioArticleSubmitted,
	StudioCafeSummary,
	StudioGateway,
	StudioImageUpload,
} from "@/app/core-logic/contextWL/studioWl/gateway/studioWl.gateway";

type HttpStudioGatewayDeps = {
	baseUrl: string;
};

const authHeaders = (adminToken: string) => ({
	Authorization: `Bearer ${adminToken}`,
	Accept: "application/json",
});

export class HttpStudioGateway implements StudioGateway {
	private readonly baseUrl: string;

	constructor(deps: HttpStudioGatewayDeps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
	}

	async submitArticle(input: { draft: StudioArticleDraft; adminToken: string }): Promise<StudioArticleSubmitted> {
		const response = await fetch(`${this.baseUrl}/api/admin/studio/articles`, {
			method: "POST",
			headers: {
				...authHeaders(input.adminToken),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input.draft),
		});
		if (!response.ok) {
			throw new Error(`Studio article submit failed: HTTP ${response.status}`);
		}
		return (await response.json()) as StudioArticleSubmitted;
	}

	async uploadArticleImage(input: StudioImageUpload): Promise<ImageRef> {
		const form = new FormData();
		form.append("articleId", input.articleId);
		if (input.alt) form.append("alt", input.alt);
		form.append("image", {
			uri: input.uri,
			name: input.name,
			type: input.type,
		} as any);

		const response = await fetch(`${this.baseUrl}/api/admin/studio/articles/images`, {
			method: "POST",
			headers: authHeaders(input.adminToken),
			body: form,
		});
		if (!response.ok) {
			throw new Error(`Studio article image upload failed: HTTP ${response.status}`);
		}
		return (await response.json()) as ImageRef;
	}

	async listCafes(input: { adminToken: string }): Promise<StudioCafeSummary[]> {
		const response = await fetch(`${this.baseUrl}/api/admin/coffees`, {
			method: "GET",
			headers: authHeaders(input.adminToken),
		});
		if (!response.ok) {
			throw new Error(`Studio cafes list failed: HTTP ${response.status}`);
		}
		const payload = (await response.json()) as any[];
		return payload.map((item) => ({
			id: String(item.id),
			name: String(item.name ?? "Cafe"),
			city: item.address?.city,
			photoUri: item.photos?.[0]?.photoUri,
		}));
	}
}
