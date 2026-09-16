export type CachedImageSource = { uri: string; cacheKey?: string };
export interface ImageCacheGateway {
	prefetchMany(urls: string[]): Promise<void>;
	prefetchSources?(sources: CachedImageSource[]): Promise<void>;
}
