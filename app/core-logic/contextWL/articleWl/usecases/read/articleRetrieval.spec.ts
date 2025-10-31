import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {AppStateWl} from "@/app/store/appStateWl";
import {FakeArticleWlGateway, flush} from "@/app/adapters/secondary/gateways/fake/fakeArticleWlGateway";
import {articleRetrievalBySlug, articlesListRetrieval} from "./articleRetrieval";
import {
    Article,
    articleLoadingStates,
} from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";

const sampleArticle = (overrides?: Partial<Article>): Article => ({
    id: "article-1" as any,
    slug: "best-coffee" as any,
    locale: "fr-FR",
    title: "Best Coffee in Town",
    intro: "Discover amazing coffee places.",
    blocks: [],
    conclusion: "Enjoy!",
    cover: undefined,
    tags: ["coffee"],
    author: { id: "user-1" as any, name: "Agnès" },
    readingTimeMin: 4,
    publishedAt: "2024-01-01T00:00:00.000Z" as any,
    updatedAt: "2024-01-02T00:00:00.000Z" as any,
    version: 1,
    status: "published",
    coffeeIds: [],
    ...overrides,
});

describe("article retrieval", () => {
    let store: ReduxStoreWl;
    let gateway: FakeArticleWlGateway;

    beforeEach(() => {
        gateway = new FakeArticleWlGateway();
        store = initReduxStoreWl({
            dependencies: {
                gateways: {
                    articles: gateway,
                },
            },
        });
    });

    it("stores the article when retrieval succeeds", async () => {
        const article = sampleArticle();
        gateway.store.set(article.id, article);

        await store.dispatch<any>(articleRetrievalBySlug({ slug: article.slug, locale: article.locale }));

        const state = store.getState().arState as AppStateWl["articles"];
        expect(state.bySlug[String(article.slug)]).toBe(String(article.id));
        expect(state.byId[String(article.id)].title).toEqual(article.title);
        expect(state.status.bySlug[String(article.slug)]).toEqual(articleLoadingStates.SUCCESS);
    });

    it("stores the error when the gateway fails", async () => {
        const article = sampleArticle();
        gateway.willFailGet = true;

        await store.dispatch<any>(articleRetrievalBySlug({ slug: article.slug, locale: article.locale }));
        await flush();

        const state = store.getState().arState as AppStateWl["articles"];
        expect(state.status.bySlug[String(article.slug)]).toEqual(articleLoadingStates.ERROR);
        expect(state.errors.bySlug[String(article.slug)]).toBe("article get failed");
    });

    it("hydrates the list for a locale", async () => {
        const articleA = sampleArticle();
        const articleB = sampleArticle({ id: "article-2" as any, slug: "guide" as any, readingTimeMin: 7 });
        gateway.setListResponse("fr-FR", { items: [articleA, articleB] });

        await store.dispatch<any>(articlesListRetrieval({ locale: "fr-FR" }));

        const state = store.getState().arState as AppStateWl["articles"];
        const list = state.listsByLocale?.["fr-FR"];
        expect(list?.ids).toEqual([String(articleA.id), String(articleB.id)]);
        expect(list?.status).toEqual(articleLoadingStates.SUCCESS);
        expect(state.byId[String(articleB.id)].readingTimeMin).toBe(7);
    });

    it("marks the list in error when listing fails", async () => {
        gateway.willFailList = true;

        await store.dispatch<any>(articlesListRetrieval({ locale: "fr-FR" }));
        await flush();

        const state = store.getState().arState as AppStateWl["articles"];
        const list = state.listsByLocale?.["fr-FR"];
        expect(list?.status).toEqual(articleLoadingStates.ERROR);
        expect(list?.error).toBe("article list failed");
    });
});
