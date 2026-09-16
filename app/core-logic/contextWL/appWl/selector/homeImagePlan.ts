import type { RootStateWl } from "@/app/store/reduxStoreWl";
import type { CachedImageSource } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/imageCache.gateway";
import { buildCoffeeDiscoveryResults } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { selectHomeHeroArticles } from "@/app/core-logic/contextWL/articleWl/selector/homeEditorialSelection";

/** Bounded first-screen assets, in display priority order. Never article body images. */
export function selectHomeImagePlan(state: RootStateWl): CachedImageSource[] {
	const result: CachedImageSource[] = [];
	const add = (uri: unknown, cacheKey?: string) => {
		if (typeof uri === "string" && /^https?:\/\//i.test(uri) && !result.some(item => (item.cacheKey ?? item.uri) === (cacheKey ?? uri))) result.push({ uri, ...(cacheKey ? { cacheKey } : {}) });
	};
	const articles = (state.arState.listsByLocale["fr-FR"]?.ids ?? []).map(id => state.arState.byId[id]).filter(Boolean);
	const hero = selectHomeHeroArticles(articles);
	const next = articles.filter(a => a.featuredRank == null && !hero.some(h => h.id === a.id)).slice(0, 3);
	for (const article of [...hero, ...next]) add(article.cover?.url ?? article.blocks.find(block => block.photo)?.photo?.url);
	add(state.aState.currentUser?.avatarUrl);
	const experiences = state.exState.mine.ids.map(id => state.exState.entities.entities[id]).filter(e => e?.status === "PUBLISHED" && e.moderationStatus === "VISIBLE").slice(0, 3);
	for (const experience of experiences) {
		const media = experience.media?.find(m => m.url || m.localUri);
		if (media?.url) add(media.url, `experience-media:${media.mediaId}`);
	}
	const coffees = buildCoffeeDiscoveryResults({ coffees: Object.values(state.cfState.byId), photosByCoffeeId: state.pState.byCoffeeId, hoursByCoffeeId: state.ohState.byCoffeeIdDayWindow, hoursStatusByCoffeeId: state.ohState.statusByCoffeeId, userCoords: state.lcState.coords, discovery: state.cfState.discovery ?? { query: "", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [], sort: "distance" } });
	for (const coffee of coffees.slice(0, 5)) add(state.pState.byCoffeeId[String(coffee.id)]?.[0]);
	return result;
}
