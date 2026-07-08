import { Image } from "expo-image";

import type { ImageCacheGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/imageCache.gateway";

export class ExpoImageCacheGateway implements ImageCacheGateway {
	async prefetchMany(urls: string[]): Promise<void> {
		if (!urls.length) return;
		await Image.prefetch(urls, "memory-disk");
	}
}
