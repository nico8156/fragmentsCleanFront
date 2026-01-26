import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { enqueueCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {
	CommandId,
	commandKinds,
	ISODate,
	statusTypes
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import type { DependenciesWl } from "@/app/store/appStateWl";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { FakeAuthTokenBridge } from "@/tests/core-logic/fakes/FakeAuthTokenBridge";
import { FakeCommentsWlGateway } from "@/tests/core-logic/fakes/FakeCommentsWlGateway";
import { FakeLikesGateway } from "@/tests/core-logic/fakes/FakeLikesGateway";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";
import { seedSignedIn } from "@/tests/core-logic/fakes/wlSeeds";
import { flush, makeFixedHelpers, makeStoreWl } from "@/tests/core-logic/fakes/wlTestHarness";


describe("processOutboxFactory", () => {
	const makeDeps = (gateways: any): DependenciesWl => ({
		gateways,
		helpers: makeFixedHelpers(),
	});
	const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

	it("skips if not signedIn", async () => {
		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const likes = new FakeLikesGateway();

		const deps = makeDeps({ authToken, likes });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		store.dispatch(outboxProcessOnce());
		await flush();

		expect(likes.addCalls.length).toBe(0);
	});

	it("skips if signedIn but no token", async () => {
		const authToken = new FakeAuthTokenBridge(null, "user_test"); // token null
		const likes = new FakeLikesGateway();

		const deps = makeDeps({ authToken, likes });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(outboxProcessOnce());
		await flush();

		expect(likes.addCalls.length).toBe(0);
	});

	it("eligible selection respects nextAttemptAt", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const likes = new FakeLikesGateway();

		const deps = makeDeps({ authToken, likes });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		// A: future retry => not eligible
		store.dispatch(
			enqueueCommitted({
				id: "obx_A",
				item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_A", targetId: "tA", at: "x" } as any, undo: {} as any },
				enqueuedAt: "x",
			}) as any,
		);
		store.dispatch({ type: "OUTBOX/SCHEDULE_RETRY", payload: { id: "obx_A", nextAttemptAt: now + 10_000 } } as any);

		// B: eligible
		store.dispatch(
			enqueueCommitted({
				id: "obx_B",
				item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_B", targetId: "tB", at: "x" } as any, undo: {} as any },
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());
		await flush();

		expect(likes.addCalls.length).toBe(1);
		expect(likes.addCalls[0].commandId).toBe("cmd_B");
	});

	it("LikeAdd happy path => awaitingAck + dequeue + nextCheckAt(now+30s)", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const likes = new FakeLikesGateway();

		const deps = makeDeps({ authToken, likes });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(
			enqueueCommitted({
				id: "obx_like_001",
				item: {
					command: { kind: commandKinds.LikeAdd, commandId: "cmd_like_001", targetId: "cafe_A", at: "2025-10-10T07:02:58.000Z" } as any,
					undo: {} as any,
				},
				enqueuedAt: "2025-10-10T07:02:59.000Z",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());
		await flush();

		const o = store.getState().oState;
		expect(o.byId["obx_like_001"].status).toBe(statusTypes.awaitingAck);
		expect(o.byId["obx_like_001"].nextCheckAt).toBe(new Date(now + 30_000).toISOString());
		expect(o.queue).toEqual([]);
		expect(o.byCommandId["cmd_like_001"]).toBe("obx_like_001");
	});

	it("LikeAdd — error => rollback + markFailed + scheduleRetry", async () => {
		const authToken = new FakeAuthTokenBridge("token", "user_test");

		class FailingLikesGateway extends FakeLikesGateway {
			override async add({ commandId, targetId, at }: any) {
				this.addCalls.push({ commandId, targetId, at });
				throw new Error("likes add failed");
			}
		}
		const likes = new FailingLikesGateway();

		const deps = makeDeps({
			likes,
			authToken,
			nowIso: "2025-10-10T07:02:00.000Z" as ISODate,
			outboxId: "obx_like_001",
			commandId: "cmd_like_001" as CommandId,
		});
		const store = initReduxStoreWl({
			dependencies: deps,
			listeners: [processOutboxFactory(deps).middleware]
		})

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(
			enqueueCommitted({
				id: "obx_like_002",
				item: {
					command: {
						kind: commandKinds.LikeAdd,
						commandId: "cmd_like_002",
						targetId: "cafe_A",
						at: "x",
					} as any,
					// ✅ undo valide (rollback stable)
					undo: {
						kind: commandKinds.LikeAdd,
						targetId: "cafe_A",
						prevCount: 10,
						prevMe: false,
						prevVersion: 1,
					} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());

		await flushPromises();

		const rec: any = store.getState().oState.byId["obx_like_002"];
		expect(rec.status).toBe(statusTypes.queued);
		expect(rec.lastError).toContain("likes add failed");
	});



	it("missing gateway => markFailed + drop + dequeue (record removed)", async () => {
		const authToken = new FakeAuthTokenBridge("token", "user_test");

		const deps = makeDeps({ authToken }); // likes absent
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(
			enqueueCommitted({
				id: "obx_like_003",
				item: {
					command: { kind: commandKinds.LikeAdd, commandId: "cmd_like_003", targetId: "cafe_A", at: "x" } as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());
		await flush();

		const o = store.getState().oState;
		expect(o.byId["obx_like_003"]).toBeUndefined();
		expect(o.byCommandId["cmd_like_003"]).toBeUndefined();
		expect(o.queue).toEqual([]);
	});

	it("CommentCreate happy path uses FakeCommentsWlGateway.create", async () => {
		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const comments = new FakeCommentsWlGateway();

		const deps = makeDeps({ authToken, comments });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(
			enqueueCommitted({
				id: "obx_cmt_001",
				item: {
					command: {
						kind: commandKinds.CommentCreate,
						commandId: "cmd_cmt_001",
						targetId: "cafe_A",
						parentId: null,
						body: "hello",
						tempId: "tmp_001",
					} as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());
		await flush();

		expect(comments.createCalls.length).toBe(1);
		expect(comments.createCalls[0]).toEqual({
			commandId: "cmd_cmt_001",
			targetId: "cafe_A",
			parentId: null,
			body: "hello",
			tempId: "tmp_001",
		});
	});

	it("TicketVerify happy path uses FakeTicketsGateway.verify", async () => {
		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const tickets = new FakeTicketsGateway();

		const deps = makeDeps({ authToken, tickets });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(
			enqueueCommitted({
				id: "obx_tk_001",
				item: {
					command: {
						kind: commandKinds.TicketVerify,
						commandId: "cmd_tk_001",
						ticketId: "tk_001",
						imageRef: "file://local/photo.jpg",
						ocrText: "TOTAL 12,34 EUR",
						at: "2025-10-10T07:00:00.000Z",
					} as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());
		await flush();

		expect(tickets.verifyCalls.length).toBe(1);
		expect(tickets.verifyCalls[0]).toMatchObject({
			commandId: "cmd_tk_001",
			ticketId: "tk_001",
			imageRef: "file://local/photo.jpg",
			ocrText: "TOTAL 12,34 EUR",
		});
	});

	it("mutex: two processOnce quickly => only one gateway call", async () => {
		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const likes = new FakeLikesGateway();

		// ralentit add pour garder inFlight = true
		likes.add = async (p: any) => {
			likes.addCalls.push(p);
			await new Promise((r) => setTimeout(r, 10));
		};

		const deps = makeDeps({ authToken, likes });
		const store = makeStoreWl({ deps, listeners: [processOutboxFactory(deps as any).middleware] });

		seedSignedIn(store, { userId: "user_test" });

		store.dispatch(
			enqueueCommitted({
				id: "obx_like_mutex",
				item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_mutex", targetId: "cafe_A", at: "x" } as any, undo: {} as any },
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(outboxProcessOnce());
		store.dispatch(outboxProcessOnce());

		await new Promise((r) => setTimeout(r, 30));

		expect(likes.addCalls.length).toBe(1);
	});
});
