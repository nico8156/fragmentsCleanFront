// processOutbox.spec.ts
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { processOutboxFactory } from "@/app/contextWL/outboxWl/processOutbox";
import { outboxProcessOnce } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { commandKinds, statusTypes } from "@/app/contextWL/outboxWl/type/outbox.type";
import { enqueueCommitted } from "@/app/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {FakeLikesGateway} from "@/app/adapters/secondary/gateways/fake/fakeLikesWlGateway"; // si tu as une action dédiée
// si tu n'as pas d'action 'enqueueCommitted' exportée, tu peux dispatcher directement un "hydrate" custom, ou muter le state via un reducer test-only.

describe("processOutboxFactory", () => {
    let store: ReduxStoreWl;

    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    // ---- Fake gateway pilotable ----
    class FakeCommentsGateway {
        willFailCreate = false;
        willFailUpdate = false;
        willFailDelete = false;

        async create(_: any) {
            if (this.willFailCreate) throw new Error("create failed");
            return;
        }
        async update(_: any) {
            if (this.willFailUpdate) throw new Error("update failed");
            return;
        }
        async delete(_: any) {
            if (this.willFailDelete) throw new Error("delete failed");
            return;
        }
    }

    const initStore = (gateways: any, helpers?: any) =>
        initReduxStoreWl({
            dependencies: { gateways, helpers },
            listeners: [processOutboxFactory({ gateways, helpers }).middleware],
        });

    // ---------- CREATE ----------
    it("CREATE — happy path: queued → processing → awaitingAck + dequeue", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        store = initStore({ comments, likes }, { nowIso: () => "2025-10-10T07:00:30.000Z" });

        // seed: record en queue
        store.dispatch(
            enqueueCommitted({
                id: "obx_0001",
                item: {
                    command: {
                        kind: commandKinds.CommentCreate,
                        commandId: "cmd_001",
                        tempId: "cmt_tmp_001",
                        targetId: "cafe_A",
                        body: "hello",
                        createdAt: "2025-10-10T07:00:00.000Z",
                    },
                    undo: { kind: commandKinds.CommentCreate, tempId: "cmt_tmp_001", targetId: "cafe_A" },
                },
                enqueuedAt: "2025-10-10T07:00:01.000Z",
            })
        );

        // act
        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        // record conservé mais statut avancé
        expect(s.byId["obx_0001"].status).toBe(statusTypes.awaitingAck);
        expect(s.byId["obx_0001"].nextCheckAt).toBe("2025-10-10T07:00:30.000Z");
        // plus dans la queue
        expect(s.queue).toEqual([]);
        // mapping toujours présent (drop sera fait à l’ACK)
        expect(s.byCommandId["cmd_001"]).toBe("obx_0001");
    });

    it("CREATE — error: rollback + failed + dequeue", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        comments.willFailCreate = true;
        store = initStore({ comments , likes});

        store.dispatch(
            enqueueCommitted({
                id: "obx_0002",
                item: {
                    command: {
                        kind: commandKinds.CommentCreate,
                        commandId: "cmd_002",
                        tempId: "cmt_tmp_002",
                        targetId: "cafe_A",
                        body: "hello2",
                        createdAt: "2025-10-10T07:00:00.000Z",
                    },
                    undo: { kind: commandKinds.CommentCreate, tempId: "cmt_tmp_002", targetId: "cafe_A" },
                },
                enqueuedAt: "2025-10-10T07:00:01.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        expect(s.byId["obx_0002"].status).toBe(statusTypes.failed);
        expect(s.byId["obx_0002"].lastError).toBe("create failed");
        expect(s.queue).toEqual([]); // dequeued
        // mapping commandId → outboxId conservé (à toi de décider de le garder pour debug, ou de le dropper dans markFailed)
        expect(s.byCommandId["cmd_002"]).toBe("obx_0002");
    });

    // ---------- UPDATE ----------
    it("UPDATE — happy path: queued → processing → awaitingAck + dequeue", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        store = initStore({ comments, likes }, { nowIso: () => "2025-10-10T07:00:31.000Z" });

        store.dispatch(
            enqueueCommitted({
                id: "obx_upd_001",
                item: {
                    command: {
                        kind: commandKinds.CommentUpdate,
                        commandId: "cmd_upd_001",
                        commentId: "cmt_0001",
                        body: "new text",
                        createdAt: "2025-10-10T07:00:10.000Z",
                    },
                    undo: {
                        kind: commandKinds.CommentUpdate,
                        commentId: "cmt_0001",
                        prevBody: "old text",
                        prevVersion: 1,
                    },
                },
                enqueuedAt: "2025-10-10T07:00:11.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        expect(s.byId["obx_upd_001"].status).toBe(statusTypes.awaitingAck);
        expect(s.byId["obx_upd_001"].nextCheckAt).toBe("2025-10-10T07:00:31.000Z");
        expect(s.queue).toEqual([]);
        expect(s.byCommandId["cmd_upd_001"]).toBe("obx_upd_001");
    });

    it("UPDATE — error: rollback + failed + dequeue", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        comments.willFailUpdate = true;
        store = initStore({ comments, likes });

        store.dispatch(
            enqueueCommitted({
                id: "obx_upd_002",
                item: {
                    command: {
                        kind: commandKinds.CommentUpdate,
                        commandId: "cmd_upd_002",
                        commentId: "cmt_0001",
                        newBody: "new text 2",
                        updatedAt: "2025-10-10T07:00:12.000Z",
                    },
                    undo: {
                        kind: commandKinds.CommentUpdate,
                        commentId: "cmt_0001",
                        prevBody: "old text 2",
                        prevVersion: 3,
                    },
                },
                enqueuedAt: "2025-10-10T07:00:13.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        expect(s.byId["obx_upd_002"].status).toBe(statusTypes.failed);
        expect(s.byId["obx_upd_002"].lastError).toBe("update failed");
        expect(s.queue).toEqual([]);
        expect(s.byCommandId["cmd_upd_002"]).toBe("obx_upd_002");
    });

    // ---------- DELETE ----------
    it("DELETE — happy path: queued → processing → awaitingAck + dequeue", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        store = initStore({ comments, likes }, { nowIso: () => "2025-10-10T07:00:32.000Z" });

        store.dispatch(
            enqueueCommitted({
                id: "obx_del_001",
                item: {
                    command: {
                        kind: commandKinds.CommentDelete,
                        commandId: "cmd_del_001",
                        commentId: "cmt_0009",
                        createdAt: "2025-10-10T07:00:20.000Z",
                    },
                    undo: {
                        kind: commandKinds.CommentDelete,
                        commentId: "cmt_0009",
                        prevBody: "will be removed",
                        prevVersion: 2,
                        prevDeletedAt: undefined,
                    },
                },
                enqueuedAt: "2025-10-10T07:00:21.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        expect(s.byId["obx_del_001"].status).toBe(statusTypes.awaitingAck);
        expect(s.byId["obx_del_001"].nextCheckAt).toBe("2025-10-10T07:00:32.000Z");
        expect(s.queue).toEqual([]);
        expect(s.byCommandId["cmd_del_001"]).toBe("obx_del_001");
    });

    it("DELETE — error: rollback + failed + dequeue", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        comments.willFailDelete = true;
        store = initStore({ comments, likes });

        store.dispatch(
            enqueueCommitted({
                id: "obx_del_002",
                item: {
                    command: {
                        kind: commandKinds.CommentDelete,
                        commandId: "cmd_del_002",
                        commentId: "cmt_0010",
                        createdAt: "2025-10-10T07:00:22.000Z",
                    },
                    undo: {
                        kind: commandKinds.CommentDelete,
                        commentId: "cmt_0010",
                        prevBody: "will be removed 2",
                        prevVersion: 5,
                        prevDeletedAt: undefined,
                    },
                },
                enqueuedAt: "2025-10-10T07:00:23.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        expect(s.byId["obx_del_002"].status).toBe(statusTypes.failed);
        expect(s.byId["obx_del_002"].lastError).toBe("delete failed");
        expect(s.queue).toEqual([]);
        expect(s.byCommandId["cmd_del_002"]).toBe("obx_del_002");
    });

    // ---------- UNSUPPORTED ----------
    it("Unsupported command — drop + dequeue (no fail)", async () => {
        const comments = new FakeCommentsGateway();
        const likes = new FakeLikesGateway();
        store = initStore({ comments, likes });

        // Seed d'une commande inconnue
        store.dispatch(
            enqueueCommitted({
                id: "obx_xxx_001",
                item: {
                    command: {
                        kind: "Unknown.Kind", // non supporté
                        commandId: "cmd_xxx_001",
                    } as any,
                    undo: {} as any,
                },
                enqueuedAt: "2025-10-10T07:00:40.000Z",
            })
        );

        store.dispatch(outboxProcessOnce());
        await flush();

        const s = store.getState().oState;
        // record supprimé (dropCommitted), plus de mapping, queue vide
        expect(s.byId["obx_xxx_001"]).toBeUndefined();
        expect(s.byCommandId["cmd_xxx_001"]).toBeUndefined();
        expect(s.queue).toEqual([]);
    });
});
