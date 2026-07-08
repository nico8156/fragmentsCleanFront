import {
	readModelCachePersistenceFactory,
	rehydrateReadModelCacheFactory,
} from "@/app/core-logic/contextWL/appWl/runtime/readModelCachePersistenceFactory";
import {
	DurableReadModelCacheSnapshot,
	READ_MODEL_CACHE_SCHEMA_VERSION,
} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import { coffeesHydrated } from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { hoursHydrated } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.action";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";

const flushPersist = () => new Promise<void>((resolve) => setTimeout(resolve, 130));

class FakeReadModelCacheStorage {
	snapshot: DurableReadModelCacheSnapshot | null = null;
	saved: DurableReadModelCacheSnapshot[] = [];

	async loadSnapshot() {
		return this.snapshot;
	}

	async saveSnapshot(snapshot: DurableReadModelCacheSnapshot) {
		this.snapshot = snapshot;
		this.saved.push(snapshot);
	}

	async clear() {
		this.snapshot = null;
	}
}

describe("readModelCachePersistenceFactory", () => {
	it("persists coffees, photos and opening hours after read hydration", async () => {
		const storage = new FakeReadModelCacheStorage();
		const store = initReduxStoreWl({
			dependencies: { gateways: {} },
			extraMiddlewares: [readModelCachePersistenceFactory({ storage })],
		});

		store.dispatch(coffeesHydrated([{
			id: "coffee_1",
			googleId: "g1",
			name: "Cafe Cache",
			location: { lat: 48, lon: -1 },
			address: { line1: "1 rue", city: "Rennes", postalCode: "35000" },
			phoneNumber: "",
			tags: [],
		} as any]));
		store.dispatch(photosHydrated({
			photos: [{ id: "photo_1", coffee_id: "coffee_1", photo_uri: "https://cdn.example/cafe.jpg" }],
		}));
		store.dispatch(hoursHydrated({
			data: [{ id: "hours_1", coffee_id: "coffee_1", weekday_description: "lundi: 08:00 – 18:00" }] as any,
		}));

		await flushPersist();

		expect(storage.saved.length).toBeGreaterThan(0);
		const latest = storage.saved.at(-1)!;
		expect(latest.schemaVersion).toBe(READ_MODEL_CACHE_SCHEMA_VERSION);
		expect(latest.coffees?.byId.coffee_1.name).toBe("Cafe Cache");
		expect(latest.cfPhotos?.byCoffeeId.coffee_1).toContain("https://cdn.example/cafe.jpg");
		expect(latest.openingHours?.byCoffeeIdDayWindow.coffee_1?.length).toBeGreaterThan(0);
	});

	it("rehydrates cached coffees, photos and opening hours into a fresh store", async () => {
		const storage = new FakeReadModelCacheStorage();
		storage.snapshot = {
			schemaVersion: READ_MODEL_CACHE_SCHEMA_VERSION,
			updatedAt: "2026-07-08T12:00:00.000Z",
			coffees: {
				byId: {
					coffee_1: {
						id: "coffee_1",
						googleId: "g1",
						name: "Cafe Cached",
						location: { lat: 48, lon: -1 },
						address: { line1: "1 rue", city: "Rennes", postalCode: "35000" },
						phoneNumber: "",
						tags: [],
					} as any,
				},
				ids: ["coffee_1"],
				byCity: { rennes: ["coffee_1"] },
			},
			cfPhotos: { byCoffeeId: { coffee_1: ["https://cdn.example/cafe.jpg"] } },
			openingHours: {
				byCoffeeIdDayWindow: { coffee_1: [{ day: 1, start: 480, end: 1080 }] },
				byCoffeeId: {},
				statusByCoffeeId: { coffee_1: "ok" },
			} as any,
		};

		const store = initReduxStoreWl({ dependencies: { gateways: {} } });
		const rehydrate = rehydrateReadModelCacheFactory({ storage });

		await rehydrate(store);

		const state: any = store.getState();
		expect(state.cfState.byId.coffee_1.name).toBe("Cafe Cached");
		expect(state.pState.byCoffeeId.coffee_1).toEqual(["https://cdn.example/cafe.jpg"]);
		expect(state.ohState.byCoffeeIdDayWindow.coffee_1).toEqual([{ day: 1, start: 480, end: 1080 }]);
	});
});
