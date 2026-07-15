import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import type {
	ProjectionSyncConnectParams,
	ProjectionSyncEvent,
	ProjectionSyncGateway,
	ProjectionSyncGatewayStatus,
} from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";
import { projectionSyncListenerFactory } from "@/app/core-logic/contextWL/projectionSyncWl/usecases/projectionSyncListenerFactory";
import { projectionSyncEnsureConnectedRequested } from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.action";
import { opTypes } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { FakeCommentsWlGateway } from "@/tests/core-logic/fakes/FakeCommentsWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import { FakeLikesGateway } from "@/tests/core-logic/fakes/FakeLikesGateway";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";
import { createMemorySyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";
import type { SavedCoffeeGateway, SavedCoffeeSnapshot } from "@/app/core-logic/contextWL/savedCoffeeWl/gateway/savedCoffee.gateway";

class FakeProjectionSyncGateway implements ProjectionSyncGateway {
	params?: ProjectionSyncConnectParams;
	state: ProjectionSyncGatewayStatus["state"] = "disconnected";
	lastEventId?: string;
	connectCalls = 0;
	disconnectCalls = 0;

	connect(params: ProjectionSyncConnectParams): void {
		this.connectCalls++;
		this.params = params;
		this.state = "connected";
		params.onStatus({ state: "connected", lastEventId: this.lastEventId });
	}

	disconnect(): void {
		this.disconnectCalls++;
		this.state = "disconnected";
	}

	getState() {
		return this.state;
	}

	getLastEventId() {
		return this.lastEventId;
	}

	emit(event: ProjectionSyncEvent) {
		if (event.id) this.lastEventId = event.id;
		this.params?.onEvent(event);
	}
}

class FakeSavedCoffeeGateway implements SavedCoffeeGateway {
	getCalls = 0;
	snapshot: SavedCoffeeSnapshot = {
		items: [{
			coffeeId: "coffee-42",
			name: "Cafe saved",
			savedAt: "2026-07-15T10:00:00.000Z",
			version: 2,
		}],
		version: 2,
	};

	async get(): Promise<SavedCoffeeSnapshot> {
		this.getCalls++;
		return this.snapshot;
	}

	async set(): Promise<void> {
		return undefined;
	}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("projectionSyncListenerFactory", () => {
	it("ignores heartbeat and routes projection.updated/comments to comments refresh GET", async () => {
		const projectionSync = new FakeProjectionSyncGateway();
		const comments = new FakeCommentsWlGateway();
		comments.nextListResponse = {
			items: [],
			nextCursor: undefined,
			prevCursor: undefined,
			serverTime: "2026-07-05T10:00:00.000Z",
		} as any;

		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					projectionSync,
					comments,
				} as any,
			},
			listeners: [
				projectionSyncListenerFactory({
					gateways: {
						projectionSync,
						comments,
					} as any,
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
				}),
			],
		});

		store.dispatch(projectionSyncEnsureConnectedRequested());
		await flush();

		expect(projectionSync.connectCalls).toBe(1);

		projectionSync.emit({
			id: "1",
			eventName: "sync.heartbeat",
			schemaVersion: 1,
		});
		await flush();
		expect(comments.listCalls).toHaveLength(0);

		projectionSync.emit({
			id: "2",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "comments",
			scope: "target",
			entityId: "target-42",
			hints: ["created"],
		});
		await flush();
		await flush();

		expect(comments.listCalls).toHaveLength(1);
		expect(comments.listCalls[0]).toMatchObject({
			targetId: "target-42",
			op: opTypes.REFRESH,
		});
		expect((store.getState() as any).psState.lastEventId).toBe("2");
	});

	it("routes projection.updated/likes to likes refresh GET", async () => {
		const projectionSync = new FakeProjectionSyncGateway();
		const likes = new FakeLikesGateway();
		likes.nextGetResponse = {
			count: 7,
			me: true,
			version: 3,
			serverTime: "2026-07-06T10:00:00.000Z",
		};

		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					projectionSync,
					likes,
				} as any,
			},
			listeners: [
				projectionSyncListenerFactory({
					gateways: {
						projectionSync,
						likes,
					} as any,
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
				}),
			],
		});

		store.dispatch(projectionSyncEnsureConnectedRequested());
		await flush();

		projectionSync.emit({
			id: "3",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "likes",
			scope: "target",
			entityId: "target-99",
			hints: ["set"],
		});
		await flush();
		await flush();

		expect(likes.getCalls).toEqual([{ targetId: "target-99" }]);
		expect((store.getState() as any).lState.byTarget["target-99"]).toMatchObject({
			count: 7,
			me: true,
			version: 3,
			optimistic: false,
		});
		expect((store.getState() as any).psState.lastEventId).toBe("3");
	});

	it("routes projection.updated/tickets to ticket status refresh GET", async () => {
		const projectionSync = new FakeProjectionSyncGateway();
		const tickets = new FakeTicketsGateway();
		tickets.nextStatusResponse = {
			...tickets.nextStatusResponse,
			status: "COMPLETED",
			outcome: "APPROVED",
			version: 4,
			amountCents: 1230,
			currency: "EUR",
			merchantName: "Cafe Test",
			occurredAt: "2026-07-06T11:00:00.000Z",
		};

		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					projectionSync,
					tickets,
				} as any,
			},
			listeners: [
				projectionSyncListenerFactory({
					gateways: {
						projectionSync,
						tickets,
					} as any,
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
				}),
			],
		});

		store.dispatch(projectionSyncEnsureConnectedRequested());
		await flush();

		projectionSync.emit({
			id: "4",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "tickets",
			scope: "entity",
			entityId: "ticket-42",
			hints: ["status", "approved"],
		});
		await flush();
		await flush();

		expect(tickets.getStatusCalls.map((call) => call.ticketId)).toEqual(["ticket-42"]);
		expect((store.getState() as any).tState.byId["ticket-42"]).toMatchObject({
			status: "CONFIRMED",
			version: 4,
			amountCents: 1230,
			currency: "EUR",
			merchantName: "Cafe Test",
			optimistic: false,
		});
		expect((store.getState() as any).psState.lastEventId).toBe("4");
	});

	it("routes projection.updated/entitlements to entitlements snapshot GET and keeps backend-published rights", async () => {
		const projectionSync = new FakeProjectionSyncGateway();
		const entitlements = new FakeEntitlementWlGateway();
		entitlements.store.set("user-42", {
			userId: "user-42",
			confirmedTickets: 5,
			rights: [],
			updatedAt: "2026-07-06T12:00:00.000Z",
		});

		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					projectionSync,
					entitlements,
				} as any,
			},
			listeners: [
				projectionSyncListenerFactory({
					gateways: {
						projectionSync,
						entitlements,
					} as any,
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
				}),
			],
		});

		store.dispatch(projectionSyncEnsureConnectedRequested());
		await flush();

		projectionSync.emit({
			id: "5",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "entitlements",
			scope: "user",
			entityId: "user-42",
			hints: ["confirmedTickets"],
		});
		await flush();
		await flush();

		expect((store.getState() as any).enState.byUser["user-42"]).toMatchObject({
			userId: "user-42",
			confirmedTickets: 5,
			rights: [],
			updatedAt: "2026-07-06T12:00:00.000Z",
		});
		expect((store.getState() as any).psState.lastEventId).toBe("5");
	});

	it("routes projection.updated/savedCoffees to saved coffees snapshot GET", async () => {
		const projectionSync = new FakeProjectionSyncGateway();
		const savedCoffees = new FakeSavedCoffeeGateway();

		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					projectionSync,
					savedCoffees,
				} as any,
			},
			listeners: [
				projectionSyncListenerFactory({
					gateways: {
						projectionSync,
						savedCoffees,
					} as any,
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
				}),
			],
		});

		store.dispatch(projectionSyncEnsureConnectedRequested());
		await flush();

		projectionSync.emit({
			id: "6",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "savedCoffees",
			scope: "user",
			entityId: "user-42",
			hints: ["set"],
		});
		await flush();
		await flush();

		expect(savedCoffees.getCalls).toBe(1);
		expect((store.getState() as any).scState.byCoffeeId["coffee-42"]).toMatchObject({
			name: "Cafe saved",
			version: 2,
		});
		expect((store.getState() as any).psState.lastEventId).toBe("6");
	});

	it("connects from the persisted projection cursor and stores the latest event id", async () => {
		const projectionSync = new FakeProjectionSyncGateway();
		const syncMetaStorage = createMemorySyncMetaStorage();
		await syncMetaStorage.setCursor("event-42");

		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					projectionSync,
				} as any,
			},
			listeners: [
				projectionSyncListenerFactory({
					gateways: {
						projectionSync,
					} as any,
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
					syncMetaStorage,
				}),
			],
		});

		store.dispatch(projectionSyncEnsureConnectedRequested());
		await flush();

		expect(projectionSync.params?.lastEventId).toBe("event-42");

		projectionSync.emit({
			id: "event-43",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "likes",
			scope: "target",
			entityId: "target-99",
			hints: ["set"],
		});
		await flush();

		expect((await syncMetaStorage.loadOrDefault()).cursor).toBe("event-43");
		expect((store.getState() as any).psState.lastEventId).toBe("event-43");
	});
});
