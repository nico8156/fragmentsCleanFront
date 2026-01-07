import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

class FakeOutboxStorage {
    loadResult: any = null;
    failOnLoad = false;

    async loadSnapshot() {
        if (this.failOnLoad) throw new Error("load failed");
        return this.loadResult;
    }
    async saveSnapshot(_: any) {}
}

class FakeLogger {
    logs: Array<{ message: string; payload?: unknown }> = [];
    log(message: string, payload?: unknown) {
        this.logs.push({ message, payload });
    }
}

const makeStore = (): ReduxStoreWl =>
    initReduxStoreWl({
        dependencies: { gateways: {}, helpers: {} as any },
        listeners: [],
    });

describe("rehydrateOutboxFactory", () => {
    it("loads snapshot, sanitizes it; reducer filters queue to queued", async () => {
        const dirty: any = {
            byId: {
                goodQueued: {
                    id: "goodQueued",
                    item: { command: { commandId: "cmd_q", kind: "Like.Add" }, undo: {} },
                    status: "queued",
                    attempts: 2,
                    enqueuedAt: 123,
                },
                goodAwait: {
                    id: "goodAwait",
                    item: { command: { commandId: "cmd_a", kind: "Like.Add" }, undo: {} },
                    status: "awaitingAck",
                    attempts: 0,
                    enqueuedAt: 456,
                    nextCheckAt: "2025-10-10T07:00:30.000Z",
                },
                badNoItem: { id: "badNoItem" },
            },
            queue: ["goodQueued", "goodAwait", "ghost", 42],
            byCommandId: { cmd_q: "goodQueued", cmd_a: "goodAwait", cmd_ghost: "ghost" },
        };

        const storage = new FakeOutboxStorage();
        storage.loadResult = dirty;

        const store = makeStore();
        const rehydrate = rehydrateOutboxFactory({ storage: storage as any });

        const result = await rehydrate(store);

        expect(result.queue).toEqual(["goodQueued", "goodAwait"]); // sanitize garde ids existants
        expect(result.byId.badNoItem).toBeUndefined();
        expect(result.byCommandId.cmd_ghost).toBeUndefined();

        const s = store.getState().oState as OutboxStateWl;
        expect(s.queue).toEqual(["goodQueued"]); // reducer garde queued uniquement
        expect(s.byId.goodAwait).toBeDefined();
    });

    it("fallback to empty if snapshot is null", async () => {
        const storage = new FakeOutboxStorage();
        storage.loadResult = null;

        const store = makeStore();
        const rehydrate = rehydrateOutboxFactory({ storage: storage as any });

        const result = await rehydrate(store);
        expect(result).toEqual({ byId: {}, queue: [], byCommandId: {} });

        const s = store.getState().oState as OutboxStateWl;
        expect(s).toEqual({ byId: {}, queue: [], byCommandId: {} });
    });

    it("logs error when load throws, still returns empty", async () => {
        const storage = new FakeOutboxStorage();
        storage.failOnLoad = true;

        const logger = new FakeLogger();
        const store = makeStore();

        const rehydrate = rehydrateOutboxFactory({
            storage: storage as any,
            logger: logger.log.bind(logger),
        });

        const result = await rehydrate(store);

        expect(logger.logs.length).toBe(1);
        expect(logger.logs[0].message).toBe("[outbox] rehydrate: failed to load snapshot");
        expect(result).toEqual({ byId: {}, queue: [], byCommandId: {} });
    });
});
