import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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

    useFocusEffect(useCallback(() => {
        if (!slug) return;
        // Keep cached content visible while renewing expiring media URLs.
        dispatch(articleRetrievalBySlug({ slug, locale }));
    }, [dispatch, slug, locale]));

    return {
        article,
        status,
        isIdle: status === articleLoadingStates.IDLE,
        isLoading: status === articleLoadingStates.PENDING,
        isLoaded: status === articleLoadingStates.SUCCESS,
        isError: status === articleLoadingStates.ERROR,
    } as const;
}
