import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    selectArticleBySlug,
    selectArticleStatusBySlug,
} from "@/app/core-logic/contextWL/articleWl/selector/articleWl.selector";
import {articleLoadingStates} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import {articleRetrievalBySlug} from "@/app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval";

export function useArticle(slug: string, locale: "fr-FR" | "en-US" = "fr-FR") {
    const dispatch = useDispatch<any>();
    const article = useSelector(selectArticleBySlug(slug));
    const status = useSelector(selectArticleStatusBySlug(slug));

    useEffect(() => {
        if (!slug) return;
        if (!article && status !== articleLoadingStates.PENDING) {
            dispatch(articleRetrievalBySlug({ slug, locale }));
        }
    }, [dispatch, slug, locale, article, status]);

    return {
        article,
        status,
        isIdle: status === articleLoadingStates.IDLE,
        isLoading: status === articleLoadingStates.PENDING,
        isLoaded: status === articleLoadingStates.SUCCESS,
        isError: status === articleLoadingStates.ERROR,
        refresh: () => dispatch(articleRetrievalBySlug({ slug, locale })),
    } as const;
}
