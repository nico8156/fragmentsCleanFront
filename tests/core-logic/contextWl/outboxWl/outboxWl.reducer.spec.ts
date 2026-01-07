import { outboxWlReducer, initialOutboxState } from "@/app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer";
import {
    enqueueCommitted,
    markProcessing,
    markAwaitingAck,
    scheduleRetry,
    dropCommitted,
    outboxRehydrateCommitted,
    dequeueCommitted,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { commandKinds, statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

describe("outboxWlReducer", () => {
    it("idempotence by commandId: second enqueue with same commandId is ignored", () => {
        const s1: any = outboxWlReducer(
            initialOutboxState as any,
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );

        const s2: any = outboxWlReducer(
            s1,
            enqueueCommitted({
                id: "obx_2",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1" } as any, undo: {} as any },
                enqueuedAt: "y",
            }) as any,
        );

        expect(Object.keys(s2.byId)).toEqual(["obx_1"]);
        expect(s2.queue).toEqual(["obx_1"]);
        expect(s2.byCommandId["cmd_1"]).toBe("obx_1");
    });

    it("markProcessing removes from queue and increments attempts only once", () => {
        let s: any = outboxWlReducer(
            initialOutboxState as any,
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.CommentCreate, commandId: "cmd_1" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );

        s = outboxWlReducer(s, markProcessing({ id: "obx_1" }) as any);
        expect(s.byId["obx_1"].status).toBe(statusTypes.processing);
        expect(s.byId["obx_1"].attempts).toBe(1);
        expect(s.queue).toEqual([]);

        s = outboxWlReducer(s, markProcessing({ id: "obx_1" }) as any);
        expect(s.byId["obx_1"].attempts).toBe(1);
    });

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
        s = outboxWlReducer(s, scheduleRetry({ id: "obx_1", nextAttemptAt: 123 }) as any);

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

        s = outboxWlReducer(s, markAwaitingAck({ id: "obx_1", ackBy: "2025-10-10T07:00:30.000Z" }) as any);

        expect(s.byId["obx_1"].status).toBe(statusTypes.awaitingAck);
        expect(s.byId["obx_1"].nextCheckAt).toBe("2025-10-10T07:00:30.000Z");
        expect(s.queue).toEqual([]);
    });

    it("dequeueCommitted removes id from queue only", () => {
        let s: any = outboxWlReducer(
            initialOutboxState as any,
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );

        s = outboxWlReducer(s, dequeueCommitted({ id: "obx_1" }) as any);
        expect(s.queue).toEqual([]);
        expect(s.byId["obx_1"]).toBeDefined();
    });

    it("dropCommitted purges byId, queue, byCommandId", () => {
        let s: any = outboxWlReducer(
            initialOutboxState as any,
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );

        s = outboxWlReducer(s, dropCommitted({ commandId: "cmd_1" }) as any);

        expect(s.byId["obx_1"]).toBeUndefined();
        expect(s.byCommandId["cmd_1"]).toBeUndefined();
        expect(s.queue).toEqual([]);
    });

    it("outboxRehydrateCommitted filters queue to queued + cleans byCommandId", () => {
        const snap: any = {
            byId: {
                a: { id: "a", item: { command: { commandId: "cmd_a" }, undo: {} }, status: "queued", attempts: 0, enqueuedAt: "x" },
                b: { id: "b", item: { command: { commandId: "cmd_b" }, undo: {} }, status: "awaitingAck", attempts: 0, enqueuedAt: "y" },
            },
            queue: ["a", "b", "ghost"],
            byCommandId: { cmd_a: "a", cmd_b: "b", cmd_ghost: "ghost" },
        };

        const s: any = outboxWlReducer(initialOutboxState as any, outboxRehydrateCommitted(snap) as any);

        expect(s.queue).toEqual(["a"]);
        expect(s.byCommandId.cmd_a).toBe("a");
        expect(s.byCommandId.cmd_b).toBe("b");
        expect(s.byCommandId.cmd_ghost).toBeUndefined();
    });
});
