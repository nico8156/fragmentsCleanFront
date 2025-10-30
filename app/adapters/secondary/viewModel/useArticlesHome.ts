import {useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {selectArticlesForLocale} from "@/app/contextWL/articleWl/selector/articleWl.selector";
import {
    Article,
    articleLoadingStates,
    ImageRef,
    Locale,
} from "@/app/contextWL/articleWl/typeAction/article.type";
import {articlesListRetrieval} from "@/app/contextWL/articleWl/usecases/read/articleRetrieval";

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

const fallbackImage: ImageRef = {
    url: "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=1600&q=80",
    width: 1600,
    height: 1067,
    alt: "Ambiance chaleureuse dans un coffee shop.",
};

const toPreview = (article: Article): ArticlePreviewVM => {
    const cover = article.cover ?? article.blocks.find((block) => block.photo)?.photo ?? fallbackImage;
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

    const groups: HomeCategoryVM[] = [
        {
            id: "featured",
            title: "Cafés à la une",
            subtitle: "Les histoires qui font vibrer la communauté",
            items: previews.slice(0, 3).map((preview) => ({
                id: preview.id,
                name: preview.title,
                slug: preview.slug,
                image: preview.cover,
            })),
        },
        {
            id: "popular",
            title: "Cafés les plus visités",
            subtitle: "Les adresses plébiscitées par les fragments",
            items: previews.slice(1, 4).map((preview) => ({
                id: preview.id,
                name: preview.title,
                slug: preview.slug,
                image: preview.cover,
            })),
        },
        {
            id: "fresh",
            title: "Nouveautés",
            subtitle: "Les derniers cafés à explorer sans tarder",
            items: previews.slice(-3).map((preview) => ({
                id: preview.id,
                name: preview.title,
                slug: preview.slug,
                image: preview.cover,
            })),
        },
    ];

    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index),
        }))
        .filter((group) => group.items.length > 0);
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
