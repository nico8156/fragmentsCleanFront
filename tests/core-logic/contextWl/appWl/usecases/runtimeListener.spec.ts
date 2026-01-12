import { initReduxStoreWl, ReduxStoreWl } from "@/app/store/reduxStoreWl";
import { createActionsRecorder } from "@/tests/core-logic/fakes/actionRecorder";

import {
	appBecameActive,
	appBecameBackground,
	appConnectivityChanged,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

import {
	outboxProcessOnce,
	outboxSuspendRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";

import {
	wsEnsureConnectedRequested,
	wsDisconnectRequested,
} from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";

import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";

import { seedSignedIn, seedOnline, seedOffline } from "@/tests/core-logic/fakes/wlSeeds";

const flush = () => new Promise<void>((r) => setImmediate(r));

describe("runtimeListenerFactory (appWl)", () => {
	let store: ReduxStoreWl;
	let rec: ReturnType<typeof createActionsRecorder>;

	beforeEach(() => {
		rec = createActionsRecorder({
			filter: (a) =>
				a.type.startsWith("APP/") ||
				a.type.startsWith("OUTBOX/") ||
				a.type.startsWith("WS/"),
		});

		store = initReduxStoreWl({
			dependencies: {
				gateways: {} as any,
				helpers: {} as any,
			},
			listeners: [
				rec.middleware,          // toujours en premier
				runtimeListenerFactory(),
			],
		});
	});

	// ─────────────────────────────────────────────────────────────
	// appBecameActive
	// ─────────────────────────────────────────────────────────────

	it("appBecameActive / not signedIn => no side effects", async () => {
		rec.clear();

		store.dispatch(appBecameActive());
		await flush();

		expect(rec.getTypes()).toEqual(["APP/BECAME_ACTIVE"]);
	});

	it("appBecameActive / signedIn => wsEnsure + outboxProcessOnce + watchdogTick", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appBecameActive());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				wsEnsureConnectedRequested.type,
				outboxProcessOnce.type,
				outboxWatchdogTick.type,
			]),
		);
	});

	// ─────────────────────────────────────────────────────────────
	// appConnectivityChanged
	// ─────────────────────────────────────────────────────────────

	it("connectivity offline => wsDisconnect + outboxSuspend", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appConnectivityChanged({ online: false }));
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				wsDisconnectRequested.type,
				outboxSuspendRequested.type,
			]),
		);
	});

	it("connectivity online / not signedIn => nothing", async () => {
		rec.clear();

		store.dispatch(appConnectivityChanged({ online: true }));
		await flush();

		expect(rec.getTypes()).toEqual(["APP/CONNECTIVITY_CHANGED"]);
	});

	it("connectivity online / signedIn => wsEnsure + outboxProcessOnce + watchdogTick", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appConnectivityChanged({ online: true }));
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				wsEnsureConnectedRequested.type,
				outboxProcessOnce.type,
				outboxWatchdogTick.type,
			]),
		);
	});

	// ─────────────────────────────────────────────────────────────
	// appBecameBackground
	// ─────────────────────────────────────────────────────────────

	it("appBecameBackground => outboxSuspend + wsDisconnect", async () => {
		seedSignedIn(store, { userId: "u1" });

		rec.clear();
		store.dispatch(appBecameBackground());
		await flush();

		const types = rec.getTypes();

		expect(types).toEqual(
			expect.arrayContaining([
				outboxSuspendRequested.type,
				wsDisconnectRequested.type,
			]),
		);
	});
});

