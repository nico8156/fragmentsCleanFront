import { rehydrateOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";

class FakeOutboxStorage {
	loadResult: any = null;
	failOnLoad = false;

	async loadSnapshot() {
		if (this.failOnLoad) throw new Error("load failed");
		return this.loadResult;
	}
	async saveSnapshot(_: any) { }
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

		// queue filtrée = uniquement queued
		expect(result.queue).toEqual(["goodQueued"]);
		expect(result.byId["goodAwait"]).toBeDefined();
		expect(result.byId["goodAwait"].status).toBe("awaitingAck");

		expect(result.byId.badNoItem).toBeUndefined();
		expect(result.byCommandId.cmd_ghost).toBeUndefined();

		const s = store.getState().oState as OutboxStateWl;
		expect(s.queue).toEqual(["goodQueued"]); // reducer garde queued uniquement
		expect(s.byId.goodAwait).toBeDefined();
	});

	it("recovers a command stuck in processing as queued after restart", async () => {
		const dirty: any = {
			byId: {
				stuckProcessing: {
					id: "stuckProcessing",
					item: { command: { commandId: "cmd_processing", kind: "Like.Add" }, undo: {} },
					status: "processing",
					attempts: 1,
					enqueuedAt: "2025-10-10T07:00:00.000Z",
				},
			},
			queue: [],
			byCommandId: { cmd_processing: "stuckProcessing" },
		};

		const storage = new FakeOutboxStorage();
		storage.loadResult = dirty;

		const store = makeStore();
		const rehydrate = rehydrateOutboxFactory({ storage: storage as any });

		const result = await rehydrate(store);

		expect(result.byId.stuckProcessing.status).toBe("queued");
		expect(result.queue).toEqual(["stuckProcessing"]);

		const state = store.getState().oState as OutboxStateWl;
		expect(state.byId.stuckProcessing.status).toBe("queued");
		expect(state.queue).toEqual(["stuckProcessing"]);
	});

	it("rebuilds missing queued ids in queue while keeping awaitingAck out of queue", async () => {
		const dirty: any = {
			byId: {
				missingQueued: {
					id: "missingQueued",
					item: { command: { commandId: "cmd_missing", kind: "Like.Add" }, undo: {} },
					status: "queued",
					attempts: 0,
					enqueuedAt: "2025-10-10T07:00:00.000Z",
				},
				awaitingAck: {
					id: "awaitingAck",
					item: { command: { commandId: "cmd_awaiting", kind: "Like.Add" }, undo: {} },
					status: "awaitingAck",
					attempts: 1,
					enqueuedAt: "2025-10-10T07:00:00.000Z",
				},
			},
			queue: [],
			byCommandId: {
				cmd_missing: "missingQueued",
				cmd_awaiting: "awaitingAck",
			},
		};

		const storage = new FakeOutboxStorage();
		storage.loadResult = dirty;

		const store = makeStore();
		const rehydrate = rehydrateOutboxFactory({ storage: storage as any });

		const result = await rehydrate(store);

		expect(result.queue).toEqual(["missingQueued"]);
		expect(result.byId.awaitingAck.status).toBe("awaitingAck");
	});

	it("fallback to empty if snapshot is null", async () => {
		const storage = new FakeOutboxStorage();
		storage.loadResult = null;

		const store = makeStore();
		const rehydrate = rehydrateOutboxFactory({ storage: storage as any });

		const result = await rehydrate(store);
		expect(result).toEqual({ byId: {}, queue: [], byCommandId: {}, suspended: false });

		const s = store.getState().oState as OutboxStateWl;
		expect(s).toEqual({ byId: {}, queue: [], byCommandId: {}, suspended: false });
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

		expect(logger.logs.some((l) => l.message === "[outbox] rehydrate: read from storage")).toBe(true);
		expect(
			logger.logs.some((l) => l.message === "[outbox] rehydrate: failed to load snapshot"),
		).toBe(true);

		expect(result).toEqual({ byId: {}, queue: [], byCommandId: {}, suspended: false });
	});
});
