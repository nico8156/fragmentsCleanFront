import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import {FakeLogger, FakeOutboxStorage} from "@/app/adapters/secondary/gateways/fake/fakeOutboxStorage";
import {rehydrateOutboxFactory} from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import {OutboxStateWl} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

const makeStore = (): ReduxStoreWl =>
    initReduxStoreWl({
        dependencies: {
            gateways: {},
            helpers: {},
        },
        listeners: [],
    });

describe("rehydrateOutboxFactory (with fakes)", () => {
    it("should load snapshot, sanitize it and dispatch outboxRehydrateCommitted", async () => {
        const dirtySnapshot: any = {
            byId: {
                good_1: {
                    id: "good_1",
                    item: {
                        command: { commandId: "cmd_good_1", kind: "Comment.Create" },
                        undo: { kind: "Comment.Create", tempId: "tmp_1", targetId: "cafe_A" },
                    },
                    status: "queued",
                    attempts: 2,
                    enqueuedAt: 1234567890,
                    lastError: "something",
                },
                bad_no_item: {
                    id: "bad_no_item",
                },
            },
            queue: ["good_1", "bad_unknown_id", 42],
            byCommandId: {
                cmd_good_1: "good_1",
                cmd_bad: 123,
            },
        };

        const storage = new FakeOutboxStorage();
        storage.loadResult = dirtySnapshot;

        const store = makeStore();
        const rehydrateOutbox = rehydrateOutboxFactory({ storage });

        const result = await rehydrateOutbox(store);

        // Snapshot retourné par la factory (sanitize 'light')
        expect(result.byId["good_1"]).toBeDefined();
        expect(result.byId["bad_no_item"]).toBeUndefined();
        expect(result.queue).toEqual(["good_1", "bad_unknown_id"]);
        expect(result.byCommandId["cmd_good_1"]).toBe("good_1");
        expect(result.byCommandId["cmd_bad"]).toBeUndefined();

        // État dans le store (filtrage final de la queue par le reducer)
        const state = store.getState().oState as OutboxStateWl;
        expect(state.byId["good_1"]).toBeDefined();
        expect(state.queue).toEqual(["good_1"]);
        expect(state.byCommandId["cmd_good_1"]).toBe("good_1");
    });

    it("should fallback to empty state when snapshot is null", async () => {
        const storage = new FakeOutboxStorage();
        storage.loadResult = null;

        const store = makeStore();
        const rehydrateOutbox = rehydrateOutboxFactory({ storage });

        const result = await rehydrateOutbox(store);

        expect(result).toEqual({
            byId: {},
            queue: [],
            byCommandId: {},
        });

        const state = store.getState().oState as OutboxStateWl;
        expect(state).toEqual({
            byId: {},
            queue: [],
            byCommandId: {},
        });
    });

    it("should log error when loadSnapshot throws, but still sanitize to empty", async () => {
        const storage = new FakeOutboxStorage();
        storage.failOnLoad = true;

        const logger = new FakeLogger();
        const store = makeStore();
        const rehydrateOutbox = rehydrateOutboxFactory({
            storage,
            logger: logger.log.bind(logger),
        });

        const result = await rehydrateOutbox(store);

        expect(logger.logs.length).toBe(1);
        expect(logger.logs[0].message).toBe("[outbox] failed to load snapshot");
        expect(result).toEqual({
            byId: {},
            queue: [],
            byCommandId: {},
        });
    });
});
