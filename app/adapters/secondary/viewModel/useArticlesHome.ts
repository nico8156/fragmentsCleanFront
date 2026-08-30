import {useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {selectArticlesForLocale} from "@/app/core-logic/contextWL/articleWl/selector/articleWl.selector";
import {
    Article,
    articleLoadingStates,
    ImageRef,
    Locale,
} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import {articlesListRetrieval} from "@/app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval";

export type ArticlePreviewVM = {
    id: string;
    slug: string;
    title: string;
    intro: string;
    tags: string[];
    cover: ImageRef;
};

export type HomeCategoryItemVM = {
    id: string;
    name: string;
    slug: string;
    image: ImageRef;
};

export type HomeCategoryVM = {
    id: string;
    title: string;
    subtitle: string;
    items: HomeCategoryItemVM[];
};

const localArticlePlaceholder: ImageRef = {
    url: require("@/assets/images/icon.png"),
    width: 1024,
    height: 1024,
    alt: "Fragments",
};

const toPreview = (article: Article): ArticlePreviewVM => {
    const cover = article.cover ?? article.blocks.find((block) => block.photo)?.photo ?? localArticlePlaceholder;
    return {
        id: String(article.id),
        slug: String(article.slug),
        title: article.title,
        intro: article.intro,
        tags: article.tags,
        cover,
    };
};

const buildCategories = (previews: ArticlePreviewVM[]): HomeCategoryVM[] => {
    if (previews.length === 0) return [];

    return [
        {
            id: "published-articles",
            title: "Tous les articles",
            subtitle: "Les histoires publiées par Fragments",
            items: previews.map((preview) => ({
                id: preview.id,
                name: preview.title,
                slug: preview.slug,
                image: preview.cover,
            })),
        },
    ];
};

export function useArticlesHome(locale: Locale = "fr-FR") {
    const dispatch = useDispatch<any>();
    const selector = useMemo(() => selectArticlesForLocale(locale), [locale]);
    const { articles, status } = useSelector(selector);

    useEffect(() => {
        if (status === articleLoadingStates.IDLE) {
            dispatch(articlesListRetrieval({ locale }));
        }
    }, [dispatch, status, locale]);

    const previews = useMemo(() => articles.map(toPreview), [articles]);
    const sliderArticles = useMemo(() => previews.slice(0, 5), [previews]);
    const categories = useMemo(() => buildCategories(previews), [previews]);

    return {
        locale,
        status,
        sliderArticles,
        categories,
        articles: previews,
        refresh: () => dispatch(articlesListRetrieval({ locale })),
        isLoading: status === articleLoadingStates.PENDING,
        isError: status === articleLoadingStates.ERROR,
    } as const;
}
