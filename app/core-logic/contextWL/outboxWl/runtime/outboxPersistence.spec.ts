import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { outboxPersistenceMiddlewareFactory } from "./outboxPersistenceFactory";
import { enqueueCommitted } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {
    markProcessing,
} from "../processOutbox";
import {
    scheduleRetry,
    outboxRehydrateCommitted,
} from "../typeAction/outbox.actions";
import {FakeLogger, FakeOutboxStorage} from "@/app/adapters/secondary/gateways/fake/fakeOutboxStorage";

const flush = () => new Promise<void>((r) => setTimeout(r, 100));

describe("outboxPersistenceMiddlewareFactory (with fakes)", () => {
    const makeStore = (storage: FakeOutboxStorage, logger: FakeLogger): ReduxStoreWl => {
        const middleware = outboxPersistenceMiddlewareFactory({
            storage,
            logger: logger.log.bind(logger),
        });

        return initReduxStoreWl({
            dependencies: {
                gateways: {},
                helpers: {},
            },
            listeners: [middleware],
        });
    };

    it("persists a snapshot when tracked actions are dispatched (debounced)", async () => {
        const storage = new FakeOutboxStorage();
        const logger = new FakeLogger();
        const store = makeStore(storage, logger);

        store.dispatch(
            enqueueCommitted({
                id: "obx_persist_001",
                item: {
                    command: {
                        kind: "Comment.Create",
                        commandId: "cmd_persist_001",
                        targetId: "cafe_A",
                        tempId: "tmp_001",
                    } as any,
                    undo: {
                        kind: "Comment.Create",
                        tempId: "tmp_001",
                        targetId: "cafe_A",
                    } as any,
                },
                enqueuedAt: "2025-10-10T07:00:00.000Z",
            }) as any
        );

        store.dispatch(markProcessing({ id: "obx_persist_001" }) as any);
        store.dispatch(
            scheduleRetry({
                id: "obx_persist_001",
                nextAttemptAt: Date.now() + 1000,
            }) as any
        );

        await flush();

        expect(storage.savedSnapshots.length).toBeGreaterThan(0);
        const snapshot = storage.savedSnapshots[0];

        expect(snapshot.byId["obx_persist_001"]).toBeDefined();
        expect(snapshot.queue).toEqual(["obx_persist_001"]);
        expect(snapshot.byCommandId["cmd_persist_001"]).toBe("obx_persist_001");
    });

    it("does not persist on outboxRehydrateCommitted (no extra write)", async () => {
        const storage = new FakeOutboxStorage();
        const logger = new FakeLogger();
        const store = makeStore(storage, logger);

        store.dispatch(
            outboxRehydrateCommitted({
                byId: {},
                queue: [],
                byCommandId: {},
            })
        );

        await flush();

        expect(storage.savedSnapshots.length).toBe(0);
    });

    it("logs but does not crash when saveSnapshot fails", async () => {
        const storage = new FakeOutboxStorage();
        storage.failOnSave = true;

        const logger = new FakeLogger();
        const store = makeStore(storage, logger);

        store.dispatch(
            enqueueCommitted({
                id: "obx_persist_002",
                item: {
                    command: {
                        kind: "Comment.Create",
                        commandId: "cmd_persist_002",
                        targetId: "cafe_A",
                        tempId: "tmp_002",
                    } as any,
                    undo: {
                        kind: "Comment.Create",
                        tempId: "tmp_002",
                        targetId: "cafe_A",
                    } as any,
                },
                enqueuedAt: "2025-10-10T07:00:01.000Z",
            }) as any
        );

        await flush();

        // on a bien loggé, mais le test ne crash pas
        expect(logger.logs.length).toBeGreaterThan(0);
        expect(logger.logs[0].message).toBe("[outbox] failed to persist");
    });
    it("clear() should reset storage and mark cleared", async () => {
        const storage = new FakeOutboxStorage();
        storage.loadResult = {
            byId: { foo: {} as any },
            queue: ["foo"],
            byCommandId: { cmd: "foo" },
        };

        await storage.clear();

        expect(storage.cleared).toBe(true);
        expect(storage.loadResult).toBeNull();
        expect(storage.savedSnapshots).toEqual([]);
    });

});
