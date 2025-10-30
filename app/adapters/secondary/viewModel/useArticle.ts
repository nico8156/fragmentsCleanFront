import {useSelector} from "react-redux";
import {
    selectArticleBySlug,
    selectArticleStatusBySlug,
} from "@/app/contextWL/articleWl/selector/articleWl.selector";
import {articleLoadingStates} from "@/app/contextWL/articleWl/typeAction/article.type";

export function useArticle(slug: string) {
    const article = useSelector(selectArticleBySlug(slug));
    const status = useSelector(selectArticleStatusBySlug(slug));

    return {
        article,
        status,
        isIdle: status === articleLoadingStates.IDLE,
        isLoading: status === articleLoadingStates.PENDING,
        isLoaded: status === articleLoadingStates.SUCCESS,
        isError: status === articleLoadingStates.ERROR,
    } as const;
}
