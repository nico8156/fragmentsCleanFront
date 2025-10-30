// Value Objects (brands) — réutilise tes ISODate/CoffeeId
import {ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";
import {CoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";

// ─────────────────────────────────────────────────────────────────────────────
// Value Objects & helpers

export type ArticleId = string & { readonly __brand: "ArticleId" };
export type Slug = string & { readonly __brand: "Slug" };
export type Locale = "fr-FR" | "en-US";
export type UserId = string & { readonly __brand: "UserId" };

export const parseToArticleId = (x: string) => x as ArticleId;
export const parseToSlug = (x: string) => x as Slug;

export const articleLoadingStates = {
    IDLE: "IDLE",
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
} as const;

export type ArticleLoadingState = typeof articleLoadingStates[keyof typeof articleLoadingStates];

export type ArticleReference =
    | { id: ArticleId | string }
    | { slug: Slug | string };

// ─────────────────────────────────────────────────────────────────────────────
// Médias
export interface ImageRef {
    url: string;
    width: number;
    height: number;
    alt?: string;
}

// Un bloc éditorial = Titre secondaire + Paragraphe + Photo (optionnelle)
export interface ArticleBlock {
    heading: string;             // titre secondaire
    paragraph: string;           // texte
    photo?: ImageRef;            // image entre les deux
}

export interface Article {
    id: ArticleId;
    slug: Slug;
    locale: Locale;

    title: string;               // titre principal
    intro: string;               // texte d’introduction
    blocks: ArticleBlock[];      // alternance heading/paragraph/photo
    conclusion: string;          // synthèse finale

    cover?: ImageRef;            // image de couverture (liste/partage)
    tags: string[];
    author: { id: UserId; name: string };

    readingTimeMin: number;      // calculé côté app (mapper)
    publishedAt?: ISODate;
    updatedAt: ISODate;

    version: number;             // contrôle d’idempotence/actualité
    status: "draft" | "published" | "archived";
    coffeeIds?: CoffeeId[];      // liens éventuels vers cafés
}

export interface ArticleListState {
    ids: string[];
    status: ArticleLoadingState;
    error?: string;
    nextCursor?: string;
    prevCursor?: string;
    lastFetchedAt?: ISODate;
}

export interface ArticleStateWl {
    byId: Record<string, Article>;
    ids: string[];
    bySlug: Record<string, string>;
    status: {
        byId: Record<string, ArticleLoadingState>;
        bySlug: Record<string, ArticleLoadingState>;
    };
    errors: {
        byId: Record<string, string | undefined>;
        bySlug: Record<string, string | undefined>;
    };
    listsByLocale: Partial<Record<Locale, ArticleListState>>;
}
