import {createReducer} from "@reduxjs/toolkit";
import {
    articleListFailed,
    articleListReceived,
    articleListRequested,
    articleReceived,
    articleRequestFailed,
    articleRequested,
} from "@/app/contextWL/articleWl/typeAction/article.action";
import {
    Article,
    ArticleStateWl,
    ArticleReference,
    articleLoadingStates,
    Locale,
} from "@/app/contextWL/articleWl/typeAction/article.type";

const initialState: ArticleStateWl = {
    byId: {},
    ids: [],
    bySlug: {},
    status: {
        byId: {},
        bySlug: {},
    },
    errors: {
        byId: {},
        bySlug: {},
    },
    listsByLocale: {},
};

const ensureListState = (state: ArticleStateWl, locale: Locale) => {
    state.listsByLocale ??= {};
    if (!state.listsByLocale[locale]) {
        state.listsByLocale[locale] = {
            ids: [],
            status: articleLoadingStates.IDLE,
        };
    }
    return state.listsByLocale[locale]!;
};

const updateReferenceState = (
    state: ArticleStateWl,
    target: ArticleReference,
    status: typeof articleLoadingStates[keyof typeof articleLoadingStates],
    error?: string,
) => {
    if ("id" in target) {
        const key = String(target.id);
        state.status.byId[key] = status;
        if (error === undefined) {
            delete state.errors.byId[key];
        } else {
            state.errors.byId[key] = error;
        }
    }
    if ("slug" in target) {
        const key = String(target.slug);
        state.status.bySlug[key] = status;
        if (error === undefined) {
            delete state.errors.bySlug[key];
        } else {
            state.errors.bySlug[key] = error;
        }
    }
};

const upsertArticle = (state: ArticleStateWl, article: Article) => {
    const id = String(article.id);
    const slug = String(article.slug);
    const prev = state.byId[id];
    state.byId[id] = prev ? { ...prev, ...article } : { ...article };
    if (!state.ids.includes(id)) state.ids.push(id);
    state.bySlug[slug] = id;
    state.status.byId[id] = articleLoadingStates.SUCCESS;
    delete state.errors.byId[id];
    state.status.bySlug[slug] = articleLoadingStates.SUCCESS;
    delete state.errors.bySlug[slug];
};

export const articleWlReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(articleRequested, (state, { payload }) => {
            updateReferenceState(state, payload.target, articleLoadingStates.PENDING);
        })
        .addCase(articleReceived, (state, { payload }) => {
            upsertArticle(state, payload.article);
        })
        .addCase(articleRequestFailed, (state, { payload }) => {
            updateReferenceState(state, payload.target, articleLoadingStates.ERROR, payload.error);
        })
        .addCase(articleListRequested, (state, { payload }) => {
            const list = ensureListState(state, payload.locale);
            list.status = articleLoadingStates.PENDING;
            list.error = undefined;
        })
        .addCase(articleListReceived, (state, { payload }) => {
            const { locale, articles, nextCursor, prevCursor } = payload;
            const list = ensureListState(state, locale);
            const ids = articles.map((article) => {
                upsertArticle(state, article);
                return String(article.id);
            });
            list.ids = ids;
            list.status = articleLoadingStates.SUCCESS;
            list.error = undefined;
            list.nextCursor = nextCursor;
            list.prevCursor = prevCursor;
        })
        .addCase(articleListFailed, (state, { payload }) => {
            const list = ensureListState(state, payload.locale);
            list.status = articleLoadingStates.ERROR;
            list.error = payload.error;
        });
});
