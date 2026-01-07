import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";
import { enqueueCommitted, markAwaitingAck, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import type { DependenciesWl } from "@/app/store/appStateWl";
import {flush, makeFixedHelpers, makeStoreWl} from "@/tests/core-logic/fakes/wlTestHarness";
import {seedOffline, seedOnline, seedSignedIn} from "@/tests/core-logic/fakes/wlSeeds";

class FakeCommandStatusGateway {
    calls: string[] = [];
    verdict: { status: "APPLIED" | "REJECTED" | "PENDING"; reason?: string } = { status: "PENDING" };
    async getStatus(commandId: string) {
        this.calls.push(commandId);
        return this.verdict;
    }
}

describe("outboxWatchdogFactory", () => {
    const makeDeps = (gateways: any): DependenciesWl => ({
        gateways,
        helpers: makeFixedHelpers(),
    });

    it("does nothing if offline", async () => {
        const commandStatus = new FakeCommandStatusGateway();
        const deps = makeDeps({ commandStatus });

        const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

        seedSignedIn(store, { userId: "user_test" });
        seedOffline(store);

        store.dispatch(outboxWatchdogTick());
        await flush();

        expect(commandStatus.calls.length).toBe(0);
    });

    it("APPLIED => dropCommitted + triggers outboxProcessOnce()", async () => {
        const now = 1_000_000;
        jest.spyOn(Date, "now").mockReturnValue(now);

        const commandStatus = new FakeCommandStatusGateway();
        commandStatus.verdict = { status: "APPLIED" };

        const deps = makeDeps({ commandStatus });
        const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

        seedSignedIn(store, { userId: "user_test" });
        seedOnline(store);

        store.dispatch(
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1", targetId: "t", at: "x" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );
        store.dispatch(markAwaitingAck({ id: "obx_1", ackBy: new Date(now - 1).toISOString() }) as any);

        const types: string[] = [];
        const orig = store.dispatch.bind(store);
        // @ts-ignore
        store.dispatch = (a: any) => {
            types.push(a.type);
            return orig(a);
        };

        store.dispatch(outboxWatchdogTick());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_1"]).toBeUndefined();
        expect(o.byCommandId["cmd_1"]).toBeUndefined();
        expect(types).toContain(outboxProcessOnce.type);
        expect(commandStatus.calls).toEqual(["cmd_1"]);
    });

    it("REJECTED => markFailed + dropCommitted", async () => {
        const now = 1_000_000;
        jest.spyOn(Date, "now").mockReturnValue(now);

        const commandStatus = new FakeCommandStatusGateway();
        commandStatus.verdict = { status: "REJECTED", reason: "nope" };

        const deps = makeDeps({ commandStatus });
        const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

        seedSignedIn(store, { userId: "user_test" });
        seedOnline(store);

        store.dispatch(
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.CommentDelete, commandId: "cmd_1", commentId: "c1", at: "x" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );
        store.dispatch(markAwaitingAck({ id: "obx_1", ackBy: new Date(now - 1).toISOString() }) as any);

        store.dispatch(outboxWatchdogTick());
        await flush();

        const o = store.getState().oState;
        expect(o.byId["obx_1"]).toBeUndefined();
        expect(o.byCommandId["cmd_1"]).toBeUndefined();
        expect(commandStatus.calls).toEqual(["cmd_1"]);
    });

    it("PENDING => replanifies nextCheckAt = now+5s", async () => {
        const now = 1_000_000;
        jest.spyOn(Date, "now").mockReturnValue(now);

        const commandStatus = new FakeCommandStatusGateway();
        commandStatus.verdict = { status: "PENDING" };

        const deps = makeDeps({ commandStatus });
        const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

        seedSignedIn(store, { userId: "user_test" });
        seedOnline(store);

        store.dispatch(
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.TicketVerify, commandId: "cmd_1", ticketId: "t1", imageRef: "x", at: "x" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );
        store.dispatch(markAwaitingAck({ id: "obx_1", ackBy: new Date(now - 1).toISOString() }) as any);

        store.dispatch(outboxWatchdogTick());
        await flush();

        const rec = store.getState().oState.byId["obx_1"];
        expect(rec.status).toBe("awaitingAck");
        expect(rec.nextCheckAt).toBe(new Date(now + 5_000).toISOString());
        expect(commandStatus.calls).toEqual(["cmd_1"]);
    });

    it("mutex: two ticks quickly => single getStatus call", async () => {
        const now = 1_000_000;
        jest.spyOn(Date, "now").mockReturnValue(now);

        const commandStatus = new FakeCommandStatusGateway();
        commandStatus.getStatus = async (cid: string) => {
            commandStatus.calls.push(cid);
            await new Promise((r) => setTimeout(r, 10));
            return { status: "PENDING" };
        };

        const deps = makeDeps({ commandStatus });
        const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

        seedSignedIn(store, { userId: "user_test" });
        seedOnline(store);

        store.dispatch(
            enqueueCommitted({
                id: "obx_1",
                item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1", targetId: "t", at: "x" } as any, undo: {} as any },
                enqueuedAt: "x",
            }) as any,
        );
        store.dispatch(markAwaitingAck({ id: "obx_1", ackBy: new Date(now - 1).toISOString() }) as any);

        store.dispatch(outboxWatchdogTick());
        store.dispatch(outboxWatchdogTick());

        await new Promise((r) => setTimeout(r, 30));
        expect(commandStatus.calls.length).toBe(1);
    });
});
