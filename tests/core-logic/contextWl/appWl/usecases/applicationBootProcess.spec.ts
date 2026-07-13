import { createApplicationBootProcess } from "@/app/core-logic/contextWL/appWl/usecases/applicationBootProcess";
import type { DurableReadModelCacheSnapshot } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import type { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";

class FakeOutboxStorage {
	snapshot: OutboxStateWl | null = {
		byId: {},
		queue: [],
		byCommandId: {},
		suspended: false,
	};
	cleared = false;

	async loadSnapshot() {
		return this.snapshot;
	}

	async saveSnapshot(snapshot: OutboxStateWl) {
		this.snapshot = snapshot;
	}

	async clear() {
		this.cleared = true;
		this.snapshot = null;
	}
}

class FakeReadModelCacheStorage {
	snapshot: DurableReadModelCacheSnapshot | null = null;

	async loadSnapshot() {
		return this.snapshot;
	}

	async saveSnapshot(snapshot: DurableReadModelCacheSnapshot) {
		this.snapshot = snapshot;
	}

	async clear() {
		this.snapshot = null;
	}
}

const logger = {
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

describe("ApplicationBootProcess", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("rehydrates runtime state, runs warmup reads, and marks boot successful", async () => {
		const outboxStorage = new FakeOutboxStorage();
		const readModelCacheStorage = new FakeReadModelCacheStorage();
		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					coffees: {
						getAllSummaries: async () => ({
							items: [{
								id: "coffee_1",
								googleId: "google_1",
								name: "Cafe Boot",
								location: { lat: 48.1, lon: -1.6 },
								address: { city: "Rennes" },
								phoneNumber: "",
								version: 1,
								updatedAt: "2026-01-01T00:00:00.000Z",
							}],
						}),
					} as any,
					cfPhotos: {
						getAllphotos: async () => ({
							data: [{ id: "photo_1", coffee_id: "coffee_1", photo_uri: "https://cdn.example/cafe.jpg" }],
						}),
					} as any,
					openingHours: {
						getAllOpeningHours: async () => ({
							data: [{ id: "hours_1", coffee_id: "coffee_1", weekday_description: "lundi: 08:00 – 18:00" }],
						}),
					} as any,
					articles: {
						list: async () => ({
							items: [{
								id: "article_1",
								slug: "boot",
								locale: "fr-FR",
								title: "Boot",
								intro: "",
								blocks: [],
								conclusion: "",
								tags: [],
								author: { id: "user_1", name: "Fragments" },
								readingTimeMin: 1,
								updatedAt: "2026-01-01T00:00:00.000Z",
								version: 1,
								status: "published",
							}],
						}),
					} as any,
				},
			},
		});

		const process = createApplicationBootProcess({
			store,
			outboxStorage,
			readModelCacheStorage,
			logger,
		});

		await process.start();

		const state = store.getState();
		expect(state.appState.boot.doneHydration).toBe(true);
		expect(state.appState.boot.doneWarmup).toBe(true);
		expect(state.appState.phase).toBe("ready");
		expect(state.cfState.byId.coffee_1.name).toBe("Cafe Boot");
		expect(state.pState.byCoffeeId.coffee_1).toEqual(["https://cdn.example/cafe.jpg"]);
		expect(state.ohState.byCoffeeIdDayWindow.coffee_1.length).toBeGreaterThan(0);
		expect(state.arState.byId.article_1.title).toBe("Boot");
		expect(logger.error).not.toHaveBeenCalled();
	});
});
