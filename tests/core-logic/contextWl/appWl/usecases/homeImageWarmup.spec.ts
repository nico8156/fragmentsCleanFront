import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { selectHomeImagePlan } from "@/app/core-logic/contextWL/appWl/selector/homeImagePlan";
import { homeImageWarmupListener } from "@/app/core-logic/contextWL/appWl/usecases/homeImageWarmupListener";
import { articleListReceived } from "@/app/core-logic/contextWL/articleWl/typeAction/article.action";
import { appConnectivityChanged } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import type { CachedImageSource } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/imageCache.gateway";

const article = (id: string, rank: number | null = null): any => ({ id, slug: id, locale: "fr-FR", title: id, blocks: [{ photo: { url: `https://images.test/body-${id}` } }], cover: { url: `https://images.test/${id}` }, featuredRank: rank });
class ImageCacheFake {
	requests: CachedImageSource[][] = [];
	async prefetchMany() {}
	async prefetchSources(sources: CachedImageSource[]) { this.requests.push(sources); }
}
const settle = () => new Promise(resolve => setImmediate(resolve));

describe("Home image warmup", () => {
	it("prefetches only featured covers and the next three, with no article body downloads", async () => {
		const cache = new ImageCacheFake();
		const store = initReduxStoreWl({ dependencies: {}, listeners: [homeImageWarmupListener(cache)] });
		const articles = [article("first", 3), article("second", 4), ...Array.from({ length: 8 }, (_, i) => article(`next-${i}`))];
		store.dispatch(articleListReceived({ locale: "fr-FR", articles }));
		await settle();
		expect(cache.requests.flat().map(s => s.uri)).toEqual(["first", "second", "next-0", "next-1", "next-2"].map(id => `https://images.test/${id}`));
		store.dispatch(articleListReceived({ locale: "fr-FR", articles }));
		await settle();
		expect(cache.requests).toHaveLength(5);
		expect(store.getState().homeImages.warming).toBe(false);
	});
	it("defers downloads offline and warms on reconnect", async () => {
		const cache = new ImageCacheFake();
		const store = initReduxStoreWl({ dependencies: {}, listeners: [homeImageWarmupListener(cache)] });
		store.dispatch(appConnectivityChanged({ online: false }));
		store.dispatch(articleListReceived({ locale: "fr-FR", articles: [article("cover")] }));
		await settle(); expect(cache.requests).toHaveLength(0);
		store.dispatch(appConnectivityChanged({ online: true }));
		await settle(); expect(cache.requests).toHaveLength(1);
	});
	it("uses the same private media cache identity as the rendered experience, skipping hidden media", () => {
		const state: any = initReduxStoreWl({ dependencies: {} }).getState();
		const copy = { ...state, exState: { ...state.exState, mine: { ids: ["visible", "hidden"] }, entities: { entities: {
			visible: { status: "PUBLISHED", moderationStatus: "VISIBLE", media: [{ mediaId: "media-1", url: "https://images.test/signed" }] },
			hidden: { status: "PUBLISHED", moderationStatus: "HIDDEN", media: [{ mediaId: "media-2", url: "https://images.test/hidden" }] },
		} } } };
		expect(selectHomeImagePlan(copy)).toEqual([{ uri: "https://images.test/signed", cacheKey: "experience-media:media-1" }]);
	});
});
