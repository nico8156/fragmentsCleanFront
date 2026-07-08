import { cfPhotoCacheListenerFactory } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/cfPhotoCacheListenerFactory";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe("cfPhotoCacheListenerFactory", () => {
	it("prefetches unique remote photo URLs after hydration", async () => {
		const imageCache = {
			prefetchMany: jest.fn(async () => undefined),
		};

		const store = initReduxStoreWl({
			dependencies: { gateways: {} },
			listeners: [cfPhotoCacheListenerFactory({ imageCache })],
		});

		store.dispatch(photosHydrated({
			photos: [
				{ id: "1", coffee_id: "c1", photo_uri: "https://cdn.example/photo-a.jpg" },
				{ id: "2", coffee_id: "c1", photo_uri: "https://cdn.example/photo-a.jpg" },
				{ id: "3", coffee_id: "c2", photo_uri: "http://cdn.example/photo-b.jpg" },
				{ id: "4", coffee_id: "c2", photo_uri: "file:///local/photo-c.jpg" },
			],
		}));
		await flush();

		expect(imageCache.prefetchMany).toHaveBeenCalledWith([
			"https://cdn.example/photo-a.jpg",
			"http://cdn.example/photo-b.jpg",
		]);
	});
});
