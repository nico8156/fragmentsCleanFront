export interface ImageCacheGateway {
	prefetchMany(urls: string[]): Promise<void>;
}
