import {createAction} from "@reduxjs/toolkit";
import {Article, ArticleReference, Locale} from "@/app/contextWL/articleWl/typeAction/article.type";

export const articleRequested = createAction<{ target: ArticleReference }>("ARTICLE/REQUESTED");
export const articleReceived = createAction<{ article: Article }>("ARTICLE/RECEIVED");
export const articleRequestFailed = createAction<{ target: ArticleReference; error: string }>("ARTICLE/REQUEST_FAILED");

export const articleListRequested = createAction<{ locale: Locale }>("ARTICLE/LIST_REQUESTED");
export const articleListReceived = createAction<{ locale: Locale; articles: Article[]; nextCursor?: string; prevCursor?: string }>("ARTICLE/LIST_RECEIVED");
export const articleListFailed = createAction<{ locale: Locale; error: string }>("ARTICLE/LIST_FAILED");
