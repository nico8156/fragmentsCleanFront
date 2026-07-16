import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";
import { enqueueCommitted, markAwaitingAck } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

import type { DependenciesWl } from "@/app/store/appStateWl";
import { makeFixedHelpers, makeStoreWl } from "@/tests/core-logic/fakes/wlTestHarness";
import { seedBootReady, seedOffline, seedOnline, seedSignedIn } from "@/tests/core-logic/fakes/wlSeeds";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/tests/core-logic/fakes/actionRecorder";
import { addOptimisticCreated } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";
import { authSessionLoadRequested } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { FakeTicketsGateway } from "@/tests/core-logic/fakes/fakeTicketWlGateway";
import { ticketOptimisticCreated } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import { appBecameBackground, appBecameForeground } from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";

class FakeCommandStatusGateway {
	calls: string[] = [];
	verdict: { status: "APPLIED" | "REJECTED" | "PENDING"; reason?: string } = { status: "PENDING" };
	async getStatus(commandId: string) {
		this.calls.push(commandId);
		return this.verdict;
	}
}

class RecordingEntitlementsGateway extends FakeEntitlementWlGateway {
	calls: string[] = [];

	override async get({ userId }: { userId: string }) {
		this.calls.push(userId);
		return super.get({ userId });
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
		seedBootReady(store);
		seedOffline(store);

		store.dispatch(outboxWatchdogTick());
		await flush();

		expect(commandStatus.calls.length).toBe(0);
	});

	it("checks ACK when auth status is transient loading but session still exists", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "PENDING" };
		const deps = makeDeps({ commandStatus });

		const store = makeStoreWl({
			deps,
			listeners: [outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: false } as any)],
		});

		seedSignedIn(store, { userId: "user_test" });
		store.dispatch(authSessionLoadRequested());
		seedBootReady(store);
		seedOnline(store);

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
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();

		expect(commandStatus.calls).toEqual(["cmd_1"]);
	});

	it("checks due ACKs immediately when app returns to foreground", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "PENDING" };
		const deps = makeDeps({ commandStatus });

		const store = makeStoreWl({
			deps,
			listeners: [outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: false } as any)],
		});

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(
			enqueueCommitted({
				id: "obx_1",
				item: {
					command: {
						kind: commandKinds.TicketVerify,
						commandId: "cmd_ticket",
						ticketId: "ticket_1",
						userId: "user_test",
						ocrText: "ticket text",
						at: "x",
					} as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(appBecameForeground());
		await flush();

		expect(commandStatus.calls).toEqual(["cmd_ticket"]);
	});

	it("keeps watchdog timer registered when app moves to background", async () => {
		const setIntervalSpy = jest
			.spyOn(global, "setInterval")
			.mockImplementation((() => 123) as any);
		const clearIntervalSpy = jest.spyOn(global, "clearInterval");

		const commandStatus = new FakeCommandStatusGateway();
		const deps = makeDeps({ commandStatus });

		const store = makeStoreWl({
			deps,
			listeners: [outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: true, tickMs: 20_000 } as any)],
		});

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(appBecameForeground());
		await flush();
		clearIntervalSpy.mockClear();

		store.dispatch(appBecameBackground());
		await flush();

		expect(setIntervalSpy).toHaveBeenCalled();
		expect(clearIntervalSpy).not.toHaveBeenCalled();
	});

	it("does not let an old PENDING ACK starve newer awaiting commands", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = {
			calls: [] as string[],
			async getStatus(commandId: string) {
				this.calls.push(commandId);
				if (commandId === "cmd_old_like") return { status: "PENDING" as const };
				if (commandId === "cmd_ticket") return { status: "APPLIED" as const };
				return { status: "PENDING" as const };
			},
		};

		const deps = makeDeps({ commandStatus });
		const store = makeStoreWl({
			deps,
			listeners: [outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: false } as any)],
		});

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(
			enqueueCommitted({
				id: "obx_old_like",
				item: {
					command: {
						kind: commandKinds.LikeAdd,
						commandId: "cmd_old_like",
						targetId: "cafe_A",
						at: "x",
					} as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);
		store.dispatch(
			enqueueCommitted({
				id: "obx_ticket",
				item: {
					command: {
						kind: commandKinds.TicketVerify,
						commandId: "cmd_ticket",
						ticketId: "ticket_1",
						userId: "user_test",
						ocrText: "ticket text",
						at: "x",
					} as any,
					undo: {} as any,
				},
				enqueuedAt: "x",
			}) as any,
		);

		store.dispatch(markAwaitingAck({ id: "obx_old_like", nextCheckAt: new Date(now - 10_000).toISOString() }) as any);
		store.dispatch(markAwaitingAck({ id: "obx_ticket", nextCheckAt: new Date(now - 1_000).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();

		expect(commandStatus.calls).toEqual(["cmd_old_like", "cmd_ticket"]);
		const outbox = store.getState().oState;
		expect(outbox.byId["obx_old_like"]).toBeDefined();
		expect(outbox.byId["obx_old_like"].status).toBe("awaitingAck");
		expect(outbox.byId["obx_ticket"]).toBeUndefined();
		expect(outbox.byCommandId["cmd_ticket"]).toBeUndefined();
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
		seedBootReady(store);
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
				nextCheckAt: new Date(now - 1).toISOString(),
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
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(
			enqueueCommitted({
				id: "obx_1",
				item: { command: { kind: commandKinds.CommentDelete, commandId: "cmd_1", commentId: "c1", at: "x" } as any, undo: {} as any },
				enqueuedAt: "x",
			}) as any,
		);
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();

		const o = store.getState().oState;
		expect(o.byId["obx_1"]).toBeUndefined();
		expect(o.byCommandId["cmd_1"]).toBeUndefined();
		expect(commandStatus.calls).toEqual(["cmd_1"]);
	});

	it("APPLIED CommentUpdate => reconciles optimistic entity and drops record", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "APPLIED" };

		const deps = makeDeps({ commandStatus });
		const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(addOptimisticCreated({
			entity: {
				id: "c1",
				targetId: "cafe_A",
				body: "new body",
				authorId: "user_test",
				createdAt: "2025-10-10T07:00:00.000Z",
				editedAt: "2025-10-10T07:05:00.000Z",
				likeCount: 0,
				replyCount: 0,
				moderation: "PUBLISHED",
				version: 7,
				optimistic: true,
			} as any,
		}));
		store.dispatch(enqueueCommitted({
			id: "obx_1",
			item: {
				command: {
					kind: commandKinds.CommentUpdate,
					commandId: "cmd_1",
					commentId: "c1",
					newBody: "new body",
					at: "2025-10-10T07:05:00.000Z",
				} as any,
				undo: { kind: commandKinds.CommentUpdate, commentId: "c1", prevBody: "old body", prevVersion: 7 } as any,
			},
			enqueuedAt: "x",
		}) as any);
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();

		const s: any = store.getState();
		expect(s.cState.entities.entities.c1.optimistic).toBe(false);
		expect(s.cState.entities.entities.c1.body).toBe("new body");
		expect(s.cState.entities.entities.c1.version).toBe(8);
		expect(s.oState.byId.obx_1).toBeUndefined();
	});

	it("APPLIED CommentDelete => reconciles optimistic soft-delete and drops record", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "APPLIED" };

		const deps = makeDeps({ commandStatus });
		const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(addOptimisticCreated({
			entity: {
				id: "c1",
				targetId: "cafe_A",
				body: "old body",
				authorId: "user_test",
				createdAt: "2025-10-10T07:00:00.000Z",
				deletedAt: "2025-10-10T07:06:00.000Z",
				likeCount: 0,
				replyCount: 0,
				moderation: "SOFT_DELETED",
				version: 7,
				optimistic: true,
			} as any,
		}));
		store.dispatch(enqueueCommitted({
			id: "obx_1",
			item: {
				command: {
					kind: commandKinds.CommentDelete,
					commandId: "cmd_1",
					commentId: "c1",
					at: "2025-10-10T07:06:00.000Z",
				} as any,
				undo: { kind: commandKinds.CommentDelete, commentId: "c1", prevBody: "old body", prevVersion: 7 } as any,
			},
			enqueuedAt: "x",
		}) as any);
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();

		const s: any = store.getState();
		expect(s.cState.entities.entities.c1.optimistic).toBe(false);
		expect(s.cState.entities.entities.c1.moderation).toBe("SOFT_DELETED");
		expect(s.cState.entities.entities.c1.version).toBe(8);
		expect(s.oState.byId.obx_1).toBeUndefined();
	});

	it("APPLIED TicketVerify => drops record and refreshes ticket status", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "APPLIED" };
		const tickets = new FakeTicketsGateway();
		const entitlements = new RecordingEntitlementsGateway();
		entitlements.store.set("user_test", {
			userId: "user_test",
			confirmedTickets: 1,
			publishedComments: 0,
			confirmedLikes: 0,
			rights: ["LIKE"],
			updatedAt: "2026-07-14T06:10:01.000Z" as any,
			pass: {
				counters: {
					validatedTickets: 1,
					publishedComments: 0,
					confirmedLikes: 0,
				},
			},
		});
		tickets.nextStatusResponse = {
			...tickets.nextStatusResponse,
			status: "CONFIRMED",
			outcome: "APPROVED",
			version: 1,
			occurredAt: "2026-07-14T06:10:00.000Z",
			amountCents: 660,
			currency: "EUR",
		} as any;

		const deps = makeDeps({ commandStatus, tickets, entitlements });
		const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(ticketOptimisticCreated({
			ticketId: "ticket_1" as any,
			at: "2026-07-14T06:00:00.000Z" as any,
			status: "ANALYZING",
		}));
		store.dispatch(enqueueCommitted({
			id: "obx_ticket",
			item: {
				command: {
					kind: commandKinds.TicketVerify,
					commandId: "cmd_ticket",
					ticketId: "ticket_1",
					ocrText: "ticket text",
					at: "2026-07-14T06:00:00.000Z",
				} as any,
				undo: { ticketId: "ticket_1" } as any,
			},
			enqueuedAt: "x",
		}) as any);
		store.dispatch(markAwaitingAck({ id: "obx_ticket", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();
		await flush();

		expect(commandStatus.calls).toEqual(["cmd_ticket"]);
		expect(tickets.getStatusCalls.map((call) => call.ticketId)).toEqual(["ticket_1"]);
		expect(entitlements.calls).toEqual(["user_test"]);
		const state = store.getState();
		expect(state.oState.byId.obx_ticket).toBeUndefined();
		expect(state.tState.byId["ticket_1" as any].status).toBe("CONFIRMED");
		expect(state.tState.byId["ticket_1" as any].optimistic).toBe(false);
		expect(state.enState.byUser.user_test.confirmedTickets).toBe(1);
		expect(state.enState.byUser.user_test.pass?.counters?.validatedTickets).toBe(1);
	});

	it("APPLIED LikeAdd => refreshes entitlements snapshot", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "APPLIED" };
		const entitlements = new RecordingEntitlementsGateway();
		entitlements.store.set("user_test", {
			userId: "user_test",
			confirmedTickets: 0,
			publishedComments: 0,
			confirmedLikes: 3,
			rights: ["LIKE"],
			updatedAt: "2026-07-14T06:11:00.000Z" as any,
			pass: {
				counters: {
					validatedTickets: 0,
					publishedComments: 0,
					confirmedLikes: 3,
				},
			},
		});

		const deps = makeDeps({ commandStatus, entitlements });
		const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(enqueueCommitted({
			id: "obx_like",
			item: {
				command: {
					kind: commandKinds.LikeAdd,
					commandId: "cmd_like",
					targetId: "cafe_A",
					at: "2026-07-14T06:10:00.000Z",
				} as any,
				undo: {} as any,
			},
			enqueuedAt: "x",
		}) as any);
		store.dispatch(markAwaitingAck({ id: "obx_like", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();
		await flush();

		expect(commandStatus.calls).toEqual(["cmd_like"]);
		expect(entitlements.calls).toEqual(["user_test"]);
		expect(store.getState().enState.byUser.user_test.confirmedLikes).toBe(3);
		expect(store.getState().enState.byUser.user_test.pass?.counters?.confirmedLikes).toBe(3);
	});

	it("APPLIED CommentCreate => refreshes entitlements snapshot", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "APPLIED" };
		const entitlements = new RecordingEntitlementsGateway();
		entitlements.store.set("user_test", {
			userId: "user_test",
			confirmedTickets: 0,
			publishedComments: 2,
			confirmedLikes: 0,
			rights: ["LIKE", "COMMENT"],
			updatedAt: "2026-07-14T06:12:00.000Z" as any,
			pass: {
				counters: {
					validatedTickets: 0,
					publishedComments: 2,
					confirmedLikes: 0,
				},
			},
		});

		const deps = makeDeps({ commandStatus, entitlements });
		const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(enqueueCommitted({
			id: "obx_comment",
			item: {
				command: {
					kind: commandKinds.CommentCreate,
					commandId: "cmd_comment",
					tempId: "comment_tmp",
					targetId: "cafe_A",
					body: "hello",
					at: "2026-07-14T06:10:00.000Z",
				} as any,
				undo: {} as any,
			},
			enqueuedAt: "x",
		}) as any);
		store.dispatch(markAwaitingAck({ id: "obx_comment", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		await flush();
		await flush();

		expect(commandStatus.calls).toEqual(["cmd_comment"]);
		expect(entitlements.calls).toEqual(["user_test"]);
		expect(store.getState().enState.byUser.user_test.publishedComments).toBe(2);
		expect(store.getState().enState.byUser.user_test.pass?.counters?.publishedComments).toBe(2);
	});

	it("PENDING => replanifies nextCheckAt = now+5s", async () => {
		const now = 1_000_000;
		jest.spyOn(Date, "now").mockReturnValue(now);

		const commandStatus = new FakeCommandStatusGateway();
		commandStatus.verdict = { status: "PENDING" };

		const deps = makeDeps({ commandStatus });
		const store = makeStoreWl({ deps, listeners: [outboxWatchdogFactory({ gateways: deps.gateways } as any)] });

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(
			enqueueCommitted({
				id: "obx_1",
				item: { command: { kind: commandKinds.TicketVerify, commandId: "cmd_1", ticketId: "t1", imageRef: "x", at: "x" } as any, undo: {} as any },
				enqueuedAt: "x",
			}) as any,
		);
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

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
		seedBootReady(store);
		seedOnline(store);

		store.dispatch(
			enqueueCommitted({
				id: "obx_1",
				item: { command: { kind: commandKinds.LikeAdd, commandId: "cmd_1", targetId: "t", at: "x" } as any, undo: {} as any },
				enqueuedAt: "x",
			}) as any,
		);
		store.dispatch(markAwaitingAck({ id: "obx_1", nextCheckAt: new Date(now - 1).toISOString() }) as any);

		store.dispatch(outboxWatchdogTick());
		store.dispatch(outboxWatchdogTick());

		await new Promise((r) => setTimeout(r, 30));
		expect(commandStatus.calls.length).toBe(1);
	});
});
