import type { ArticleBlock, ImageRef, Locale } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";

export type StudioArticleDraft = {
	slug: string;
	locale: Locale;
	authorId: string;
	authorName: string;
	title: string;
	intro: string;
	blocks: ArticleBlock[];
	conclusion: string;
	cover?: ImageRef;
	tags: string[];
	readingTimeMin?: number;
	coffeeIds: string[];
};

export type StudioArticleSubmitted = {
	commandId: string;
	articleId: string;
	slug: string;
	locale: Locale;
	status: string;
};

export type StudioImageUpload = {
	articleId: string;
	uri: string;
	name: string;
	type: string;
	alt?: string;
	adminToken: string;
};

export type StudioCafeSummary = {
	id: string;
	name: string;
	city?: string;
	photoUri?: string;
};

export type StudioGateway = {
	submitArticle(input: { draft: StudioArticleDraft; adminToken: string }): Promise<StudioArticleSubmitted>;
	uploadArticleImage(input: StudioImageUpload): Promise<ImageRef>;
	listCafes(input: { adminToken: string }): Promise<StudioCafeSummary[]>;
};
