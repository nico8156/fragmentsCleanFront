import { createListenerMiddleware, accountGeneration } from "../runtime/accountScope";
import { selectHomeImagePlan } from "../selector/homeImagePlan";
import type { ImageCacheGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/imageCache.gateway";
import type { RootStateWl, AppDispatchWl } from "@/app/store/reduxStoreWl";
import { homeImagesWarming, homeImagesSettled } from "../typeAction/homeWarmup.action";

export function homeImageWarmupListener(imageCache?: ImageCacheGateway) {
	const middleware = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	let generation = -1;
	let revision = 0;
	let previousPlan = "";
	const completed = new Set<string>();
	const inFlight = new Map<string, Promise<void>>();
	middleware.startListening({
		predicate: (_action, state, before) => state.arState !== before.arState || state.pState !== before.pState || state.cfState !== before.cfState || state.exState !== before.exState || state.aState.currentUser !== before.aState.currentUser || state.lcState !== before.lcState || state.appState.online !== before.appState.online || state.accountScope !== before.accountScope,
		effect: async (_, api) => {
			const state = api.getState();
			if (generation !== accountGeneration(state)) { generation = accountGeneration(state); revision++; completed.clear(); inFlight.clear(); previousPlan = ""; }
			if (!state.appState.online || !state.accountScope.ready || !imageCache) return;
			const plan = selectHomeImagePlan(state);
			const signature = JSON.stringify(plan);
			if (signature === previousPlan) return;
			previousPlan = signature;
			const attempt = ++revision;
			const account = generation;
			const pending = plan.filter(source => !completed.has(source.cacheKey ?? source.uri));
			if (!pending.length) { api.dispatch(homeImagesSettled()); return; }
			api.dispatch(homeImagesWarming());
			try {
				const results = await Promise.allSettled(pending.map(source => {
					const key = source.cacheKey ?? source.uri;
					const existing = inFlight.get(key);
					if (existing) return existing;
					const request = (imageCache.prefetchSources ? imageCache.prefetchSources([source]) : imageCache.prefetchMany([source.uri]))
						.then(() => { if (account === generation) completed.add(key); })
						.finally(() => { if (inFlight.get(key) === request) inFlight.delete(key); });
					inFlight.set(key, request);
					return request;
				}));
				if (results.some(result => result.status === "rejected")) throw new Error("Some Home images could not be warmed");
			} catch { if (attempt === revision) previousPlan = ""; }
			finally { if (attempt === revision) api.dispatch(homeImagesSettled()); }
		},
	});
	return middleware.middleware;
}
