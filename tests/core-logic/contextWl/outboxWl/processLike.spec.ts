// likeWl/outbox/processOutbox.likes.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {FakeLikesGateway, flush} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {commandKinds, statusTypes} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";


describe("Outbox process — Likes", () => {
    let store: ReduxStoreWl;
    let likes: FakeLikesGateway;
    let comments: FakeCommentsWlGateway;

    const FIXED_NOW = Date.parse("2025-10-10T07:03:00.000Z");

    const init = (gateways: any, helpers?: any) =>
        initReduxStoreWl({
            dependencies: { gateways, helpers },
            listeners: [processOutboxFactory({ gateways, helpers: {
                    nowMs: () => FIXED_NOW,
                    nowPlusMs: (ms:number) => new Date(FIXED_NOW + ms).toISOString(),
                } }).middleware],
        });

    it("LikeAdd — happy path: awaitingAck + dequeue", async () => {
        likes = new FakeLikesGateway();
        comments = new FakeCommentsWlGateway();
        store = init({ likes, comments }, { nowIso: () => "2025-10-10T07:03:00.000Z" });

        store.dispatch(
            enqueueCommitted({
                id: "obx_like_001",
                item: {
                    command: {
                        kind: commandKinds.LikeAdd,
                        commandId: "cmd_like_001",
                        targetId: "cafe_A",
                        at: "2025-10-10T07:02:58.000Z",
                        userId: "user_test",
                    },
                    undo: { kind: commandKinds.LikeAdd, targetId: "cafe_A", prevCount: 10, prevMe: false, prevVersion: 1 },
                },
                enqueuedAt: "2025-10-10T07:02:59.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());

        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_like_001"].status).toBe(statusTypes.awaitingAck);
        expect(o.byId["obx_like_001"].nextCheckAt).toBe("2025-10-10T07:03:30.000Z"); // now + 30s
        expect(o.queue).toEqual([]);
        expect(o.byCommandId["cmd_like_001"]).toBe("obx_like_001");
    });

    it("LikeAdd — error: rollback + failed ", async () => {
        likes = new FakeLikesGateway();
        comments = new FakeCommentsWlGateway();
        likes.willFailAdd = true;
        store = init({ likes , comments});

        store.dispatch(
            enqueueCommitted({
                id: "obx_like_002",
                item: {
                    command: {
                        kind: commandKinds.LikeAdd,
                        commandId: "cmd_like_002",
                        targetId: "cafe_A",
                        at: "2025-10-10T07:03:10.000Z",
                        userId: "user_test",
                    },
                    undo: { kind: commandKinds.LikeAdd, targetId: "cafe_A", prevCount: 10, prevMe: false, prevVersion: 1 },
                },
                enqueuedAt: "2025-10-10T07:03:11.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_like_002"].status).toBe(statusTypes.queued);
        expect(o.byId["obx_like_002"].lastError).toBe("likes add failed");
        expect(o.queue).toEqual(["obx_like_002",]);
        expect(o.byCommandId["cmd_like_002"]).toBe("obx_like_002");
    });

    it("LikeRemove — happy path: awaitingAck ", async () => {
        likes = new FakeLikesGateway();
        comments = new FakeCommentsWlGateway();
        store = init({ likes, comments }, { nowIso: () => "2025-10-10T07:03:20.000Z" });

        store.dispatch(
            enqueueCommitted({
                id: "obx_unlike_001",
                item: {
                    command: {
                        kind: commandKinds.LikeRemove,
                        commandId: "cmd_unlike_001",
                        targetId: "cafe_A",
                        at: "2025-10-10T07:03:18.000Z",
                        userId: "user_test",
                    },
                    undo: { kind: commandKinds.LikeRemove, targetId: "cafe_A", prevCount: 11, prevMe: true, prevVersion: 2 },
                },
                enqueuedAt: "2025-10-10T07:03:19.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_unlike_001"].status).toBe(statusTypes.awaitingAck);
        expect(o.byId["obx_unlike_001"].nextCheckAt).toBe("2025-10-10T07:03:30.000Z");
        expect(o.queue).toEqual([]);
        expect(o.byCommandId["cmd_unlike_001"]).toBe("obx_unlike_001");
    });

    it("LikeRemove — error: rollback + failed", async () => {
        likes = new FakeLikesGateway();
        comments = new FakeCommentsWlGateway();
        likes.willFailRemove = true;
        store = init({ likes, comments });

        store.dispatch(
            enqueueCommitted({
                id: "obx_unlike_002",
                item: {
                    command: {
                        kind: commandKinds.LikeRemove,
                        commandId: "cmd_unlike_002",
                        targetId: "cafe_A",
                        at: "2025-10-10T07:03:30.000Z",
                        userId: "user_test",
                    },
                    undo: { kind: commandKinds.LikeRemove, targetId: "cafe_A", prevCount: 11, prevMe: true, prevVersion: 2 },
                },
                enqueuedAt: "2025-10-10T07:03:31.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_unlike_002"].status).toBe(statusTypes.queued);
        expect(o.byId["obx_unlike_002"].lastError).toBe("likes remove failed");
        expect(o.queue).toEqual(["obx_unlike_002"]);
        expect(o.byCommandId["cmd_unlike_002"]).toBe("obx_unlike_002");
    });
    it("LikeAdd — no likes gateway: markFailed + drop + dequeue", async () => {
        likes = new FakeLikesGateway();
        comments = new FakeCommentsWlGateway();

        // ⚠️ on n'enregistre PAS likes dans gateways, donc need(LikeAdd) retournera null
        store = init({ comments }); // pas de { likes }

        store.dispatch(
            enqueueCommitted({
                id: "obx_like_003",
                item: {
                    command: {
                        kind: commandKinds.LikeAdd,
                        commandId: "cmd_like_003",
                        targetId: "cafe_A",
                        at: "2025-10-10T07:03:40.000Z",
                        userId: "user_test",
                    },
                    undo: {
                        kind: commandKinds.LikeAdd,
                        targetId: "cafe_A",
                        prevCount: 10,
                        prevMe: false,
                        prevVersion: 1,
                    },
                },
                enqueuedAt: "2025-10-10T07:03:41.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const o = store.getState().oState;

        // record supprimé (dropCommitted)
        expect(o.byId["obx_like_003"]).toBeUndefined();
        // mapping supprimé
        expect(o.byCommandId["cmd_like_003"]).toBeUndefined();
        // queue vide
        expect(o.queue).toEqual([]);
    });
});
