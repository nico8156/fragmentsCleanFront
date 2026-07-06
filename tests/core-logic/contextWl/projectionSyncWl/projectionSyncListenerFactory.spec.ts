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
import { FakeLikesGateway } from "@/tests/core-logic/fakes/FakeLikesGateway";

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
});
