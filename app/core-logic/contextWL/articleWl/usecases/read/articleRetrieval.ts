import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {
    articleListFailed,
    articleListReceived,
    articleListRequested,
    articleReceived,
    articleRequestFailed,
    articleRequested,
} from "@/app/core-logic/contextWL/articleWl/typeAction/article.action";
import {Locale, Slug} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";

export const articleRetrievalBySlug = ({
    slug,
    locale,
    ifNoneMatch,
}: {
    slug: Slug | string;
    locale: Locale;
    ifNoneMatch?: string;
}): AppThunkWl<Promise<void>> =>
    async (dispatch, _getState, gateways) => {
        dispatch(articleRequested({ target: { slug } }));
        try {
            const articleGateway = gateways?.articles;
            if (!articleGateway) throw new Error("article gateway unavailable");
            const { data } = await articleGateway.getBySlug({ slug: String(slug), locale, ifNoneMatch });
            dispatch(articleReceived({ article: data }));
        } catch (error: any) {
            dispatch(
                articleRequestFailed({
                    target: { slug },
                    error: error?.message ?? "article retrieval failed",
                }),
            );
        }
    };

export const articlesListRetrieval = ({
    locale,
    limit,
    cursor,
}: {
    locale: Locale;
    limit?: number;
    cursor?: string;
}): AppThunkWl<Promise<void>> =>
    async (dispatch, _getState, gateways) => {
        dispatch(articleListRequested({ locale }));
        try {
            const articleGateway = gateways?.articles;
            if (!articleGateway) throw new Error("article gateway unavailable");
            const { items, nextCursor, prevCursor } = await articleGateway.list({ locale, limit, cursor });
            dispatch(
                articleListReceived({
                    locale,
                    articles: items,
                    nextCursor,
                    prevCursor,
                }),
            );
        } catch (error: any) {
            dispatch(
                articleListFailed({
                    locale,
                    error: error?.message ?? "articles list retrieval failed",
                }),
            );
        }
    };
