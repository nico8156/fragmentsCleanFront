import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { outboxPersistenceMiddlewareFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/outboxPersistenceFactory";
import { enqueueCommitted, outboxRehydrateCommitted, markProcessing } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

class FakeOutboxStorage {
    savedSnapshots: any[] = [];
    failOnSave = false;

    async saveSnapshot(s: any) {
        if (this.failOnSave) throw new Error("save failed");
        this.savedSnapshots.push(s);
    }
    async loadSnapshot() {
        return null;
    }
}

class FakeLogger {
    logs: Array<{ message: string; payload?: unknown }> = [];
    log(message: string, payload?: unknown) {
        this.logs.push({ message, payload });
    }
}

describe("outboxPersistenceMiddlewareFactory", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    const makeStore = (storage: FakeOutboxStorage, logger: FakeLogger): ReduxStoreWl => {
        const mw = outboxPersistenceMiddlewareFactory({
            storage: storage as any,
            logger: logger.log.bind(logger),
        });

        return initReduxStoreWl({
            dependencies: { gateways: {}, helpers: {} as any },
            listeners: [mw],
        });
    };

    it("persists snapshot on tracked actions (debounced)", async () => {
        const storage = new FakeOutboxStorage();
        const logger = new FakeLogger();
        const store = makeStore(storage, logger);

        store.dispatch(
            enqueueCommitted({
                id: "obx_1",
                item: {
                    command: { kind: commandKinds.CommentCreate, commandId: "cmd_1", targetId: "cafe", tempId: "tmp" } as any,
                    undo: {} as any,
                },
                enqueuedAt: "2025-10-10T07:00:00.000Z",
            }) as any,
        );
        store.dispatch(markProcessing({ id: "obx_1" }) as any);

        jest.advanceTimersByTime(80);
        await Promise.resolve();

        expect(storage.savedSnapshots.length).toBeGreaterThan(0);
        const snap = storage.savedSnapshots[0];
        expect(snap.byId["obx_1"]).toBeDefined();
        expect(snap.byCommandId["cmd_1"]).toBe("obx_1");
    });

    it("does not persist on outboxRehydrateCommitted", async () => {
        const storage = new FakeOutboxStorage();
        const logger = new FakeLogger();
        const store = makeStore(storage, logger);

        store.dispatch(outboxRehydrateCommitted({ byId: {}, queue: [], byCommandId: {} } as any));

        jest.advanceTimersByTime(100);
        await Promise.resolve();

        expect(storage.savedSnapshots.length).toBe(0);
    });

    it("logs but does not crash when saveSnapshot fails", async () => {
        const storage = new FakeOutboxStorage();
        storage.failOnSave = true;

        const logger = new FakeLogger();
        const store = makeStore(storage, logger);

        store.dispatch(
            enqueueCommitted({
                id: "obx_2",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_2" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );

        jest.advanceTimersByTime(80);
        await Promise.resolve();

        expect(logger.logs.length).toBeGreaterThan(0);
        expect(logger.logs[0].message).toBe("[outbox] failed to persist");
    });
});
