import { initReduxStoreWl, type ReduxStoreWl } from "@/app/store/reduxStoreWl";

import { likesRetrieved } from "@/app/core-logic/contextWL/likeWl/typeAction/likeWl.action";
import { ackLikesListenerFactory, onLikeAddedAck, onLikeRemovedAck } from "@/app/core-logic/contextWL/likeWl/usecases/read/ackLike";

import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { commandKinds, type CommandId, type ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import { makeStoreWl, makeFixedHelpers } from "@/tests/core-logic/fakes/wlTestHarness";
const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe("Likes ACK (WS → reconcile + drop outbox)", () => {
	let store: ReduxStoreWl;

	beforeEach(() => {

		const deps = { gateways: {}, helpers: makeFixedHelpers() } as any;
		store = makeStoreWl({ deps, listeners: [ackLikesListenerFactory()] });


		store.dispatch(
			likesRetrieved({
				targetId: "cafe_A",
				count: 10,
				me: false,
				version: 1,
				serverTime: "2025-10-10T07:01:00.000Z" as ISODate,
			}),
		);
	});

	it("ACK LikeAdd: reconcile then dropCommitted (by commandId)", async () => {
		// seed outbox record (mapping byCommandId indispensable pour drop)
		store.dispatch(
			enqueueCommitted({
				id: "obx_like_001",
				item: {
					command: {
						kind: commandKinds.LikeAdd,
						commandId: "cmd_like_001" as CommandId,
						targetId: "cafe_A",
						at: "2025-10-10T07:02:00.000Z" as ISODate,
					},
					undo: {
						kind: commandKinds.LikeAdd,
						targetId: "cafe_A",
						prevCount: 10,
						prevMe: false,
						prevVersion: 1,
					},
				},
				enqueuedAt: "2025-10-10T07:02:00.000Z" as ISODate,
			}),
		);

		// WS -> action ACK
		store.dispatch(
			onLikeAddedAck({
				commandId: "cmd_like_001",
				targetId: "cafe_A",
				server: {
					count: 11,
					me: true,
					version: 2,
					updatedAt: "2025-10-10T07:02:05.000Z" as ISODate,
				},
			}),
		);

		await flushPromises();

		// assert like reconciled
		const agg = store.getState().lState.byTarget["cafe_A"];
		expect(agg.count).toBe(11);
		expect(agg.me).toBe(true);
		expect(agg.version).toBe(2);
		expect(agg.optimistic).toBe(false);

		// assert outbox dropped
		const o = store.getState().oState;
		expect(o.byId["obx_like_001"]).toBeUndefined();
		expect(o.byCommandId["cmd_like_001"]).toBeUndefined();
		expect(o.queue).not.toContain("obx_like_001");
	});

	it("ACK LikeRemove: reconcile then dropCommitted (by commandId)", async () => {
		// seed état liké
		store.dispatch(
			likesRetrieved({
				targetId: "cafe_A",
				count: 11,
				me: true,
				version: 2,
				serverTime: "2025-10-10T07:01:30.000Z" as ISODate,
			}),
		);

		store.dispatch(
			enqueueCommitted({
				id: "obx_unlike_001",
				item: {
					command: {
						kind: commandKinds.LikeRemove,
						commandId: "cmd_unlike_001" as CommandId,
						targetId: "cafe_A",
						at: "2025-10-10T07:02:10.000Z" as ISODate,
					},
					undo: {
						kind: commandKinds.LikeRemove,
						targetId: "cafe_A",
						prevCount: 11,
						prevMe: true,
						prevVersion: 2,
					},
				},
				enqueuedAt: "2025-10-10T07:02:10.000Z" as ISODate,
			}),
		);

		store.dispatch(
			onLikeRemovedAck({
				commandId: "cmd_unlike_001",
				targetId: "cafe_A",
				server: {
					count: 10,
					me: false,
					version: 3,
					updatedAt: "2025-10-10T07:02:15.000Z" as ISODate,
				},
			}),
		);

		await flushPromises();

		const agg = store.getState().lState.byTarget["cafe_A"];
		expect(agg.count).toBe(10);
		expect(agg.me).toBe(false);
		expect(agg.version).toBe(3);
		expect(agg.optimistic).toBe(false);

		const o = store.getState().oState;
		expect(o.byId["obx_unlike_001"]).toBeUndefined();
		expect(o.byCommandId["cmd_unlike_001"]).toBeUndefined();
		expect(o.queue).not.toContain("obx_unlike_001");
	});

	it("ACK older version is ignored (does not downgrade)", async () => {
		// état serveur plus récent déjà en place
		store.dispatch(
			likesRetrieved({
				targetId: "cafe_A",
				count: 99,
				me: true,
				version: 10,
				serverTime: "2025-10-10T07:01:59.000Z" as ISODate,
			}),
		);

		store.dispatch(
			onLikeAddedAck({
				commandId: "cmd_irrelevant" as any,
				targetId: "cafe_A",
				server: {
					count: 11,
					me: true,
					version: 2, // plus vieux
					updatedAt: "2025-10-10T07:02:05.000Z" as ISODate,
				},
			}),
		);

		await flushPromises();

		const agg = store.getState().lState.byTarget["cafe_A"];
		expect(agg.version).toBe(10);
		expect(agg.count).toBe(99);
		expect(agg.me).toBe(true);
	});
});
