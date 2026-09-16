import { Image } from "expo-image";
import { ExpoImageCacheGateway } from "@/app/adapters/secondary/gateways/coffee/ExpoImageCacheGateway";
jest.mock("expo-image", () => ({ Image: { prefetch: jest.fn(), loadAsync: jest.fn() } }));

describe("Expo Home image cache adapter", () => {
	beforeEach(() => jest.clearAllMocks());
	it("shares the four-download budget across concurrent warmup batches", async () => {
		const release: (() => void)[] = [];
		(Image.prefetch as jest.Mock).mockImplementation(() => new Promise<boolean>(resolve => release.push(() => resolve(true))));
		const cache = new ExpoImageCacheGateway();
		const first = cache.prefetchSources(Array.from({ length: 4 }, (_, i) => ({ uri: `https://images.test/${i}` })));
		const second = cache.prefetchSources([{ uri: "https://images.test/next" }]);
		expect(Image.prefetch).toHaveBeenCalledTimes(4);
		release.shift()!(); await new Promise(resolve => setImmediate(resolve));
		expect(Image.prefetch).toHaveBeenCalledTimes(5);
		release.forEach(done => done()); await Promise.all([first, second]);
	});
	it("warms the stable private cache key used by ExperiencePhoto and releases the decoded reference", async () => {
		const release = jest.fn();
		(Image.loadAsync as jest.Mock).mockResolvedValue({ release });
		await new ExpoImageCacheGateway().prefetchSources([{ uri: "https://images.test/signed", cacheKey: "experience-media:1" }]);
		expect(Image.loadAsync).toHaveBeenCalledWith({ uri: "https://images.test/signed", cacheKey: "experience-media:1" });
		expect(release).toHaveBeenCalledTimes(1);
	});
});
