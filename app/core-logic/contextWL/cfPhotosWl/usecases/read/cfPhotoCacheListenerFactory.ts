import type { ImageCacheGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/imageCache.gateway";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";

type Deps = {
	imageCache?: ImageCacheGateway;
};

const uniqueRemoteUrls = (urls: string[]) =>
	Array.from(new Set(urls.filter((url) => /^https?:\/\//i.test(url))));

export const cfPhotoCacheListenerFactory = (deps: Deps) => {
	const mw = createListenerMiddleware<RootStateWl, AppDispatchWl>();
	const listen = mw.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;

	listen({
		actionCreator: photosHydrated,
		effect: async (action) => {
			const urls = uniqueRemoteUrls(action.payload.photos.map((photo) => photo.photo_uri));
			if (!urls.length) return;
			await deps.imageCache?.prefetchMany(urls);
		},
	});

	return mw.middleware;
};
