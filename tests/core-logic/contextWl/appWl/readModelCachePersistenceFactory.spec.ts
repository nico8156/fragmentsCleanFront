import {
	readModelCachePersistenceFactory,
	rehydrateReadModelCacheFactory,
} from "@/app/core-logic/contextWL/appWl/runtime/readModelCachePersistenceFactory";
import {
	DurableReadModelCacheSnapshot,
	READ_MODEL_CACHE_SCHEMA_VERSION,
} from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";
import { articleListReceived } from "@/app/core-logic/contextWL/articleWl/typeAction/article.action";
import { coffeesHydrated } from "@/app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { commentsRetrieved } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { entitlementsHydrated } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";
import { likesRetrieved } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { hoursHydrated } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.action";
import { ticketRetrieved } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
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
	it("persists read model slices after read hydration", async () => {
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
		store.dispatch(articleListReceived({
			locale: "fr" as any,
			articles: [{
				id: "article_1",
				slug: "offline-readiness",
				title: "Offline",
				body: "Ready",
				locale: "fr",
			}] as any,
		}));
		store.dispatch(commentsRetrieved({
			targetId: "coffee_1" as any,
			op: opTypes.RETRIEVE,
			items: [{
				id: "comment_1",
				targetId: "coffee_1",
				authorId: "user_1",
				body: "Bon cafe",
				createdAt: "2026-07-08T12:00:00.000Z",
				version: 1,
			}] as any,
			serverTime: "2026-07-08T12:00:00.000Z",
		}));
		store.dispatch(likesRetrieved({
			targetId: "coffee_1" as any,
			count: 4,
			me: true,
			version: 2,
			serverTime: "2026-07-08T12:00:00.000Z",
		}));
		store.dispatch(ticketRetrieved({
			ticketId: "ticket_1" as any,
			status: "CONFIRMED",
			version: 3,
			updatedAt: "2026-07-08T12:00:00.000Z" as any,
		}));
		store.dispatch(entitlementsHydrated({
			userId: "user_1",
			confirmedTickets: 5,
			updatedAt: "2026-07-08T12:00:00.000Z",
		}));

		await flushPersist();

		expect(storage.saved.length).toBeGreaterThan(0);
		const latest = storage.saved.at(-1)!;
		expect(latest.schemaVersion).toBe(READ_MODEL_CACHE_SCHEMA_VERSION);
		expect(latest.coffees?.byId.coffee_1.name).toBe("Cafe Cache");
		expect(latest.cfPhotos?.byCoffeeId.coffee_1).toContain("https://cdn.example/cafe.jpg");
		expect(latest.openingHours?.byCoffeeIdDayWindow.coffee_1?.length).toBeGreaterThan(0);
		expect(latest.articles?.byId.article_1.title).toBe("Offline");
		expect(latest.comments?.entities.entities.comment_1?.body).toBe("Bon cafe");
		expect(latest.likes?.byTarget.coffee_1).toMatchObject({ count: 4, me: true });
		expect(latest.tickets?.byId.ticket_1.status).toBe("CONFIRMED");
		expect(latest.entitlement?.byUser.user_1.confirmedTickets).toBe(5);
	});

	it("rehydrates cached read models into a fresh store", async () => {
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
			articles: {
				byId: { article_1: { id: "article_1", slug: "offline-readiness", title: "Offline" } as any },
				ids: ["article_1"],
				bySlug: { "offline-readiness": "article_1" },
				status: { byId: {}, bySlug: {} },
				errors: { byId: {}, bySlug: {} },
				listsByLocale: { fr: { ids: ["article_1"], status: "success" } },
			} as any,
			comments: {
				entities: {
					ids: ["comment_1"],
					entities: {
						comment_1: {
							id: "comment_1",
							targetId: "coffee_1",
							authorId: "user_1",
							body: "Cached comment",
							createdAt: "2026-07-08T12:00:00.000Z",
							version: 1,
						},
					},
				},
				byTarget: { coffee_1: { ids: ["comment_1"], loading: "success", filters: { sort: "new" } } },
			} as any,
			likes: { byTarget: { coffee_1: { targetId: "coffee_1", count: 4, me: true, version: 2 } } } as any,
			tickets: { byId: { ticket_1: { ticketId: "ticket_1", status: "CONFIRMED", version: 3 } } } as any,
			entitlement: {
				byUser: {
					user_1: {
						userId: "user_1",
						confirmedTickets: 5,
						rights: ["LIKE", "COMMENT", "SUBMIT_CAFE"],
						updatedAt: "2026-07-08T12:00:00.000Z",
					},
				},
				thresholds: { likeAt: 1, commentAt: 3, submitCafeAt: 5 },
			} as any,
		};

		const store = initReduxStoreWl({ dependencies: { gateways: {} } });
		const rehydrate = rehydrateReadModelCacheFactory({ storage });

		await rehydrate(store);

		const state: any = store.getState();
		expect(state.cfState.byId.coffee_1.name).toBe("Cafe Cached");
		expect(state.pState.byCoffeeId.coffee_1).toEqual(["https://cdn.example/cafe.jpg"]);
		expect(state.ohState.byCoffeeIdDayWindow.coffee_1).toEqual([{ day: 1, start: 480, end: 1080 }]);
		expect(state.arState.byId.article_1.title).toBe("Offline");
		expect(state.cState.entities.entities.comment_1.body).toBe("Cached comment");
		expect(state.lState.byTarget.coffee_1).toMatchObject({ count: 4, me: true });
		expect(state.tState.byId.ticket_1.status).toBe("CONFIRMED");
		expect(state.enState.byUser.user_1.confirmedTickets).toBe(5);
	});
});
