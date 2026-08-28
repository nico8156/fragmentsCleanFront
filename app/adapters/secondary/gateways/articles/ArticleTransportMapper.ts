import type {Article, ArticleBlock, ImageRef} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import {parseToArticleId, parseToSlug} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import type {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export function mapArticleTransport(input: unknown): Article {
    const article = object(input, "article");
    const blocks = array(article.blocks, "article.blocks").map((block) => mapBlock(block));
    const author = object(article.author, "article.author");
    return {
        id: parseToArticleId(string(article.id, "article.id")),
        slug: parseToSlug(string(article.slug, "article.slug")),
        locale: locale(article.locale),
        title: string(article.title, "article.title"),
        intro: string(article.intro, "article.intro"),
        blocks,
        conclusion: string(article.conclusion, "article.conclusion"),
        cover: article.cover == null ? undefined : image(article.cover, "article.cover"),
        tags: array(article.tags, "article.tags").map((tag) => string(tag, "article.tags[]")),
        author: {id: string(author.id, "article.author.id") as Article["author"]["id"], name: string(author.name, "article.author.name")},
        readingTimeMin: positiveNumber(article.readingTimeMin, "article.readingTimeMin"),
        publishedAt: optionalString(article.publishedAt) as Article["publishedAt"],
        updatedAt: string(article.updatedAt, "article.updatedAt") as Article["updatedAt"],
        version: positiveNumber(article.version, "article.version"),
        status: status(article.status),
        coffeeIds: article.coffeeIds == null ? [] : array(article.coffeeIds, "article.coffeeIds").map((id) => string(id, "article.coffeeIds[]") as CoffeeId),
    };
}

function mapBlock(input: unknown): ArticleBlock {
    const block = object(input, "article.blocks[]");
    return {
        heading: string(block.heading, "article.blocks[].heading"),
        paragraph: string(block.paragraph, "article.blocks[].paragraph"),
        photo: block.photo == null ? undefined : image(block.photo, "article.blocks[].photo"),
    };
}

function image(input: unknown, path: string): ImageRef {
    const value = object(input, path);
    return {url: string(value.url, `${path}.url`), width: positiveNumber(value.width, `${path}.width`), height: positiveNumber(value.height, `${path}.height`), alt: optionalString(value.alt)};
}

function object(value: unknown, path: string): Record<string, any> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${path}`);
    return value as Record<string, any>;
}
function array(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value)) throw new Error(`Invalid ${path}`);
    return value;
}
function string(value: unknown, path: string): string {
    if (typeof value !== "string" || value.trim() === "") throw new Error(`Invalid ${path}`);
    return value;
}
function optionalString(value: unknown): string | undefined {
    return value == null ? undefined : string(value, "optional value");
}
function positiveNumber(value: unknown, path: string): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error(`Invalid ${path}`);
    return value;
}
function locale(value: unknown): Article["locale"] {
    if (value !== "fr-FR" && value !== "en-US") throw new Error("Invalid article.locale");
    return value;
}
function status(value: unknown): Article["status"] {
    if (value !== "draft" && value !== "published" && value !== "archived") throw new Error("Invalid article.status");
    return value;
}
