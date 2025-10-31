import {createSelector} from "@reduxjs/toolkit";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import {
    Article,
    ArticleListState,
    ArticleLoadingState,
    articleLoadingStates,
    Locale,
} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";

const selectArticleSlice = (state: RootStateWl) => state.arState;

export const selectArticleById = (id: string) =>
    createSelector(selectArticleSlice, (state) => state.byId[String(id)]);

export const selectArticleBySlug = (slug: string) =>
    createSelector(selectArticleSlice, (state) => {
        const id = state.bySlug[String(slug)];
        return id ? state.byId[id] : undefined;
    });

export const selectArticleStatusById = (id: string) =>
    createSelector(
        selectArticleSlice,
        (state): ArticleLoadingState => state.status.byId[String(id)] ?? articleLoadingStates.IDLE,
    );

export const selectArticleStatusBySlug = (slug: string) =>
    createSelector(
        selectArticleSlice,
        (state): ArticleLoadingState => state.status.bySlug[String(slug)] ?? articleLoadingStates.IDLE,
    );

export const selectArticleErrorBySlug = (slug: string) =>
    createSelector(selectArticleSlice, (state) => state.errors.bySlug[String(slug)]);

export type ArticlesForLocaleSelectorResult = {
    articles: Article[];
    status: ArticleLoadingState;
    error?: string;
    nextCursor?: string;
    prevCursor?: string;
    lastFetchedAt?: ArticleListState["lastFetchedAt"];
};

export const selectArticlesForLocale = (locale: Locale) =>
    createSelector(selectArticleSlice, (state): ArticlesForLocaleSelectorResult => {
        const list = state.listsByLocale?.[locale];
        if (!list) {
            return {
                articles: [],
                status: articleLoadingStates.IDLE,
            };
        }
        const articles = list.ids
            .map((id) => state.byId[id])
            .filter((article): article is Article => Boolean(article));
        return {
            articles,
            status: list.status,
            error: list.error,
            nextCursor: list.nextCursor,
            prevCursor: list.prevCursor,
            lastFetchedAt: list.lastFetchedAt,
        };
    });
