import { initialOutboxState, outboxWlReducer } from "@/app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer";
import {
	dequeueCommitted,
	dropCommitted,
	enqueueCommitted,
	markAwaitingAck,
	markProcessing,
	outboxRehydrateCommitted,
	scheduleRetry,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds, statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
it("scheduleRetry puts back to queued, sets nextAttemptAt and ensures in queue", () => {
	let s: any = outboxWlReducer(
		initialOutboxState as any,
		enqueueCommitted({
			id: "obx_1",
			item: { command: { kind: commandKinds.TicketVerify, commandId: "cmd_1" } as any, undo: {} as any },
			enqueuedAt: "x",
		}) as any,
	);

	s = outboxWlReducer(s, markProcessing({ id: "obx_1" }) as any);
	s = outboxWlReducer(s, scheduleRetry({ id: "obx_1", nextAttemptAtMs: 123 }) as any);

	expect(s.byId["obx_1"].status).toBe(statusTypes.queued);
	expect((s.byId["obx_1"] as any).nextAttemptAt).toBe(123);
	expect(s.queue).toEqual(["obx_1"]);
});

it("markAwaitingAck removes from queue and sets nextCheckAt", () => {
	let s: any = outboxWlReducer(
		initialOutboxState as any,
		enqueueCommitted({
			id: "obx_1",
			item: { command: { kind: commandKinds.LikeRemove, commandId: "cmd_1" } as any, undo: {} as any },
			enqueuedAt: "x",
		}) as any,
	);

	s = outboxWlReducer(
		s,
		markAwaitingAck({ id: "obx_1", ackByIso: "2025-10-10T07:00:30.000Z" }) as any,
	);

	expect(s.byId["obx_1"].status).toBe(statusTypes.awaitingAck);
	expect(s.byId["obx_1"].nextCheckAt).toBe("2025-10-10T07:00:30.000Z");
	expect(s.queue).toEqual([]);
});

