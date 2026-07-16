import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    selectArticleBySlug,
    selectArticleStatusBySlug,
} from "@/app/core-logic/contextWL/articleWl/selector/articleWl.selector";
import { articleRetrievalBySlug } from "@/app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval";
import {articleLoadingStates, type Locale} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";

export function useArticle(slug: string, locale: Locale = "fr-FR") {
    const dispatch = useDispatch<AppDispatchWl>();
    const article = useSelector(selectArticleBySlug(slug));
    const status = useSelector(selectArticleStatusBySlug(slug));

    useEffect(() => {
        if (!slug) return;
        if (!article && status !== articleLoadingStates.PENDING) {
            dispatch(articleRetrievalBySlug({ slug, locale }) as any);
        }
    }, [dispatch, slug, locale, article, status]);

    return {
        article,
        status,
        isIdle: status === articleLoadingStates.IDLE,
        isLoading: status === articleLoadingStates.PENDING,
        isLoaded: status === articleLoadingStates.SUCCESS,
        isError: status === articleLoadingStates.ERROR,
    } as const;
}
