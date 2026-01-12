import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";
import { enqueueCommitted, markAwaitingAck } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import type { DependenciesWl } from "@/app/store/appStateWl";
import { makeFixedHelpers, makeStoreWl } from "@/tests/core-logic/fakes/wlTestHarness";
import { seedOffline, seedOnline, seedSignedIn } from "@/tests/core-logic/fakes/wlSeeds";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/tests/core-logic/fakes/actionRecorder";

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

	const flush = () => new Promise<void>((r) => setImmediate(r));

	it("APPLIED => DROP_COMMITTED + PROCESS_ONCE (recorded)", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		// Fake commandStatus gateway
		const commandStatus = {
			getStatus: jest.fn(async (_commandId: string) => ({ status: "APPLIED" as const })),
		};

		const deps: DependenciesWl = {
			gateways: {
				commandStatus: commandStatus as any,
			},
			helpers: {} as any, // watchdog n'utilise pas helpers
		};

		const recorder = createActionsRecorder({
			filter: (a) => a.type.startsWith("OUTBOX/"),
		});

		const store = initReduxStoreWl({
			dependencies: deps,
			listeners: [
				recorder.middleware, // ✅ important: avant le watchdog
				outboxWatchdogFactory({
					gateways: deps.gateways,
					enableTimer: false, // ✅ pas de setInterval en test
				} as any),
			],
		});

		seedSignedIn(store, { userId: "user_test" });
		seedOnline(store);

		// Seed record + le rendre éligible watchdog : awaitingAck + nextCheckAt <= now
		store.dispatch(
			enqueueCommitted({
				id: "obx_1",
				item: {
					command: {
						kind: commandKinds.LikeAdd,
						commandId: "cmd_1",
						targetId: "cafe_A",
						at: "x",
					} as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(
			markAwaitingAck({
				id: "obx_1",
				ackBy: new Date(now - 1).toISOString(), // ✅ expiré
			}) as any,
		);

		// Act
		recorder.clear();
		store.dispatch(outboxWatchdogTick());
		await flush();

		// Assert gateway called + actions dispatched
		expect(commandStatus.getStatus).toHaveBeenCalledWith("cmd_1");

		const types = recorder.getTypes();
		expect(types).toContain("OUTBOX/WATCHDOG_TICK");
		expect(types).toContain("OUTBOX/DROP_COMMITTED");
		expect(types).toContain("OUTBOX/PROCESS_ONCE");

		// (optionnel) sanity: l'outbox record a été purgé
		const s: any = store.getState();
		expect(s.oState.byId["obx_1"]).toBeUndefined();
		expect(s.oState.byCommandId["cmd_1"]).toBeUndefined();
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
