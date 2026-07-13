import { clearOutboxForDev } from "@/app/core-logic/contextWL/outboxWl/runtime/outboxDevTools";
import { enqueueCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds, type OutboxStateWl } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";

const makeStorage = (): OutboxStorageGateway & { cleared: boolean; saved?: OutboxStateWl } => {
	const storage: OutboxStorageGateway & { cleared: boolean; saved?: OutboxStateWl } = {
		cleared: false,
		async loadSnapshot() {
			return null;
		},
		async saveSnapshot(snapshot) {
			storage.saved = snapshot;
		},
		async clear() {
			storage.cleared = true;
		},
	};
	return storage;
};

describe("outbox dev tools", () => {
	it("clearOutboxForDev clears durable storage and Redux state", async () => {
		const store = initReduxStoreWl({ dependencies: {} });
		const storage = makeStorage();
		const logger = { info: jest.fn(), warn: jest.fn() };

		store.dispatch(enqueueCommitted({
			id: "obx_1",
			item: {
				command: { kind: commandKinds.LikeAdd, commandId: "cmd_1", targetId: "cafe_A", at: "x" } as any,
				undo: {} as any,
			},
			enqueuedAt: "x",
		}) as any);

		await clearOutboxForDev({ store, outboxStorage: storage, logger });

		expect(storage.cleared).toBe(true);
		expect(store.getState().oState.byId).toEqual({});
		expect(store.getState().oState.queue).toEqual([]);
		expect(store.getState().oState.byCommandId).toEqual({});
		expect(logger.warn).toHaveBeenCalledWith("[OUTBOX_DEV] local outbox cleared");
	});
});
