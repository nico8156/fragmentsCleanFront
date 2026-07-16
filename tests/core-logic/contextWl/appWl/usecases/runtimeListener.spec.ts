import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/tests/core-logic/fakes/actionRecorder";

import {
	appBecameActive,
	appBecameBackground,
	appBecameForeground,
	appBecameInactive,
	appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import {
	outboxProcessOnce,
	outboxResumeRequested,
	outboxSuspendRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";

import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";
import {
	projectionSyncDisconnectRequested,
	projectionSyncEnsureConnectedRequested,
} from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.action";
import {
	authMaybeRefreshRequested,
	authUserHydrationRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

import { seedBootReady, seedSignedIn } from "@/tests/core-logic/fakes/wlSeeds";
import { FakeCommentsWlGateway } from "@/tests/core-logic/fakes/FakeCommentsWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import { FakeLikesGateway } from "@/tests/core-logic/fakes/FakeLikesGateway";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";
import { commentsRetrieved } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { likesRetrieved } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { entitlementsHydrated } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";
import { ticketOptimisticCreated } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import type { SavedCoffeeGateway, SavedCoffeeSnapshot } from "@/app/core-logic/contextWL/savedCoffeeWl/gateway/savedCoffee.gateway";
import { savedCoffeesRetrieved } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.action";

const flush = () => new Promise<void>((r) => setImmediate(r));

class FakeSavedCoffeeGateway implements SavedCoffeeGateway {
	getCalls = 0;
	nextSnapshot: SavedCoffeeSnapshot = { items: [], version: 1 };

	async get(): Promise<SavedCoffeeSnapshot> {
		this.getCalls += 1;
		return this.nextSnapshot;
	}

	async set(): Promise<void> {
		return undefined;
	}
}

describe("runtimeListenerFactory (appWl)", () => {
	let store: ReduxStoreWl;
	let rec: ReturnType<typeof createActionsRecorder>;

	beforeEach(() => {
		rec = createActionsRecorder({
			filter: (a) =>
				a.type.startsWith("APP/") ||
				a.type.startsWith("OUTBOX/") ||
				a.type.startsWith("projectionSync/") ||
				a.type.startsWith("auth/"),
		});

		store = initReduxStoreWl({
			dependencies: {
				gateways: {} as any,
				helpers: {} as any,
			},
			listeners: [
				rec.middleware,          // toujours en premier
				runtimeListenerFactory(),
			],
		});
	});

	// ─────────────────────────────────────────────────────────────
	// appBecameActive
	// ─────────────────────────────────────────────────────────────

	it("appBecameActive / not signedIn => resumes outbox suspension only", async () => {
		rec.clear();

		store.dispatch(appBecameActive());
		await flush();

		expect(rec.getTypes()).toEqual(["APP/BECAME_ACTIVE", "OUTBOX/RESUME_REQUESTED"]);
	});

	it("appBecameActive / signedIn => projectionSyncEnsure + outboxProcessOnce + watchdogTick", async () => {
		seedSignedIn(store, { userId: "u1" });
		seedBootReady(store);

		rec.clear();
		store.dispatch(appBecameActive());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				outboxResumeRequested.type,
				projectionSyncEnsureConnectedRequested.type,
				outboxProcessOnce.type,
				outboxWatchdogTick.type,
			]),
		);
		expect(types.filter((type) => type === projectionSyncEnsureConnectedRequested.type)).toHaveLength(1);
	});

	it("appBecameForeground / signedIn => resumes outbox + restarts runtime work", async () => {
		seedSignedIn(store, { userId: "u1" });
		seedBootReady(store);

		rec.clear();
		store.dispatch(appBecameForeground());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				outboxResumeRequested.type,
				authMaybeRefreshRequested.type,
				authUserHydrationRequested.type,
				projectionSyncEnsureConnectedRequested.type,
				outboxProcessOnce.type,
				outboxWatchdogTick.type,
			]),
		);
		expect(types.filter((type) => type === projectionSyncEnsureConnectedRequested.type)).toHaveLength(1);
	});

	// ─────────────────────────────────────────────────────────────
	// appConnectivityChanged
	// ─────────────────────────────────────────────────────────────

	it("connectivity offline => projectionSyncDisconnect + outboxSuspend", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appConnectivityChanged({ online: false }));
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				projectionSyncDisconnectRequested.type,
				outboxSuspendRequested.type,
			]),
		);
	});

	it("connectivity online / not signedIn => nothing", async () => {
		rec.clear();

		store.dispatch(appConnectivityChanged({ online: true }));
		await flush();
		expect(rec.getTypes()).toEqual(["APP/CONNECTIVITY_CHANGED", 'OUTBOX/RESUME_REQUESTED']);
	});

	it("connectivity online / signedIn => projectionSyncEnsure + outboxProcessOnce + watchdogTick", async () => {
		seedSignedIn(store, { userId: "u1" });
		seedBootReady(store);

		rec.clear();
		store.dispatch(appConnectivityChanged({ online: true }));
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				outboxResumeRequested.type,
				authMaybeRefreshRequested.type,
				authUserHydrationRequested.type,
				projectionSyncEnsureConnectedRequested.type,
				outboxProcessOnce.type,
				outboxWatchdogTick.type,
			]),
		);
	});

	// ─────────────────────────────────────────────────────────────
	// appBecameBackground
	// ─────────────────────────────────────────────────────────────

	it("appBecameBackground => records lifecycle pause without durable runtime suspension", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appBecameBackground());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual([appBecameBackground.type]);
		expect(types).not.toContain(outboxSuspendRequested.type);
		expect(types).not.toContain(projectionSyncDisconnectRequested.type);
	});

	it("appBecameInactive => records lifecycle pause without durable runtime suspension", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appBecameInactive());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual([appBecameInactive.type]);
		expect(types).not.toContain(outboxSuspendRequested.type);
		expect(types).not.toContain(projectionSyncDisconnectRequested.type);
	});

	it("background then foreground / signedIn => foreground resumes and restarts runtime work", async () => {
		seedSignedIn(store, { userId: "u1" });
		seedBootReady(store);

		rec.clear();
		store.dispatch(appBecameBackground());
		await flush();
		store.dispatch(appBecameForeground());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				outboxResumeRequested.type,
				authMaybeRefreshRequested.type,
				authUserHydrationRequested.type,
				projectionSyncEnsureConnectedRequested.type,
				outboxProcessOnce.type,
				outboxWatchdogTick.type,
			]),
		);
		expect(types).not.toContain(outboxSuspendRequested.type);
		expect(types).not.toContain(projectionSyncDisconnectRequested.type);
	});

	it("appBecameActive refreshes known read models missed while backgrounded", async () => {
		const comments = new FakeCommentsWlGateway();
		const likes = new FakeLikesGateway();
		const tickets = new FakeTicketsGateway();
		const entitlements = new FakeEntitlementWlGateway();
		const savedCoffees = new FakeSavedCoffeeGateway();

		comments.nextListResponse = {
			items: [],
			serverTime: "2026-07-14T07:00:00.000Z",
		} as any;
		likes.nextGetResponse = {
			count: 3,
			me: true,
			version: 2,
			serverTime: "2026-07-14T07:00:01.000Z",
		};
		tickets.nextStatusResponse = {
			...tickets.nextStatusResponse,
			status: "COMPLETED",
			outcome: "APPROVED",
			version: 3,
		};
		entitlements.store.set("u1", {
			userId: "u1",
			confirmedTickets: 1,
			publishedComments: 2,
			confirmedLikes: 3,
			updatedAt: "2026-07-14T07:00:02.000Z",
		});

		const localStore = initReduxStoreWl({
			dependencies: {
				gateways: {
					comments,
					likes,
					tickets,
					entitlements,
					savedCoffees,
				} as any,
				helpers: {} as any,
			},
			listeners: [runtimeListenerFactory()],
		});

		seedSignedIn(localStore, { userId: "u1" });
		seedBootReady(localStore);
		localStore.dispatch(commentsRetrieved({
			targetId: "coffee_1",
			op: opTypes.RETRIEVE,
			items: [],
		}));
		localStore.dispatch(likesRetrieved({
			targetId: "coffee_1",
			count: 1,
			me: false,
			version: 1,
		}));
		localStore.dispatch(savedCoffeesRetrieved({
			items: [{
				coffeeId: "coffee_1",
				name: "Cafe 1",
				savedAt: "2026-07-14T06:00:00.000Z",
				version: 1,
			}],
			version: 1,
		}));
		localStore.dispatch(entitlementsHydrated({
			userId: "u1",
			confirmedTickets: 0,
			updatedAt: "2026-07-14T06:00:00.000Z",
		}));
		localStore.dispatch(ticketOptimisticCreated({
			ticketId: "ticket_1" as any,
			imageRef: "image_1",
			ocrText: null,
			at: "2026-07-14T06:30:00.000Z" as any,
		}));

		localStore.dispatch(appBecameActive());
		await flush();
		await flush();

		expect(comments.listCalls.map((call) => call.targetId)).toEqual(["coffee_1"]);
		expect(likes.getCalls).toEqual([{ targetId: "coffee_1" }]);
		expect(savedCoffees.getCalls).toBe(1);
		expect(tickets.getStatusCalls.map((call) => call.ticketId)).toEqual(["ticket_1"]);
		expect(localStore.getState().enState.byUser.u1).toMatchObject({
			confirmedTickets: 1,
			publishedComments: 2,
			confirmedLikes: 3,
		});
	});
});
