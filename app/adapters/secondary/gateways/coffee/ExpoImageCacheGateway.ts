import { Image } from "expo-image";

import type { ImageCacheGateway, CachedImageSource } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/imageCache.gateway";

export class ExpoImageCacheGateway implements ImageCacheGateway {
	private active = 0;
	private readonly waiting: (() => void)[] = [];
	async prefetchMany(urls: string[]): Promise<void> {
		if (!urls.length) return;
		await Image.prefetch(urls, "memory-disk");
	}
	async prefetchSources(sources: CachedImageSource[]): Promise<void> {
		// Bound concurrent downloads; private media use the same stable key as ExperiencePhoto.
		const results = await Promise.allSettled(sources.map(async source => {
			if (this.active >= 4) await new Promise<void>(resolve => this.waiting.push(resolve));
			else this.active++;
			try {
				if (source.cacheKey) {
					const image = await Image.loadAsync(source);
					image.release();
				} else if (!await Image.prefetch(source.uri, "memory-disk")) throw new Error("Image prefetch failed");
			} finally {
				const next = this.waiting.shift();
				if (next) next(); else this.active--;
			}
		}));
		if (results.some(result => result.status === "rejected")) throw new Error("Image prefetch failed");
	}
}
