// likeWl/outbox/processOutbox.likes.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { processOutboxFactory } from "@/app/contextWL/outboxWl/processOutbox";
import { outboxProcessOnce, enqueueCommitted } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {FakeLikesGateway, flush} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway";
import {commandKinds, statusTypes} from "@/app/contextWL/outboxWl/type/outbox.type";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";


describe("Outbox process — Likes", () => {
    let store: ReduxStoreWl;
    let likes: FakeLikesGateway;
    let comments: FakeCommentsWlGateway;

    const init = (gateways: any, helpers?: any) =>
        initReduxStoreWl({
            dependencies: { gateways, helpers },
            listeners: [processOutboxFactory({ gateways, helpers }).middleware],
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
        expect(o.byId["obx_like_001"].nextCheckAt).toBe("2025-10-10T07:03:00.000Z");
        expect(o.queue).toEqual([]);
        expect(o.byCommandId["cmd_like_001"]).toBe("obx_like_001");
    });

    it("LikeAdd — error: rollback + failed + dequeue", async () => {
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
                    },
                    undo: { kind: commandKinds.LikeAdd, targetId: "cafe_A", prevCount: 10, prevMe: false, prevVersion: 1 },
                },
                enqueuedAt: "2025-10-10T07:03:11.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_like_002"].status).toBe(statusTypes.failed);
        expect(o.byId["obx_like_002"].lastError).toBe("likes add failed");
        expect(o.queue).toEqual([]);
        expect(o.byCommandId["cmd_like_002"]).toBe("obx_like_002");
    });

    it("LikeRemove — happy path: awaitingAck + dequeue", async () => {
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
        expect(o.byId["obx_unlike_001"].nextCheckAt).toBe("2025-10-10T07:03:20.000Z");
        expect(o.queue).toEqual([]);
        expect(o.byCommandId["cmd_unlike_001"]).toBe("obx_unlike_001");
    });

    it("LikeRemove — error: rollback + failed + dequeue", async () => {
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
                    },
                    undo: { kind: commandKinds.LikeRemove, targetId: "cafe_A", prevCount: 11, prevMe: true, prevVersion: 2 },
                },
                enqueuedAt: "2025-10-10T07:03:31.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_unlike_002"].status).toBe(statusTypes.failed);
        expect(o.byId["obx_unlike_002"].lastError).toBe("likes remove failed");
        expect(o.queue).toEqual([]);
        expect(o.byCommandId["cmd_unlike_002"]).toBe("obx_unlike_002");
    });
});
