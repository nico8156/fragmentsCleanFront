import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { experienceWriteListenerFactory } from "@/app/core-logic/contextWL/experienceWl/usecases/write/experienceWriteListenerFactory";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";
import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import { experienceOptimisticCreated, uiExperienceCreateRequested, uiExperienceDeleteRequested } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import { GatewayError } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";
import { FakeAuthTokenBridge } from "@/tests/core-logic/fakes/FakeAuthTokenBridge";
import { seedBootReady, seedOnline, seedSignedIn } from "@/tests/core-logic/fakes/wlSeeds";
import { makeFixedHelpers } from "@/tests/core-logic/fakes/wlTestHarness";
import type { DependenciesWl } from "@/app/store/appStateWl";

class RecordingExperienceGateway {
	calls: string[] = [];
	failCreate = true;
	failUpload = false;
	async create() { this.calls.push("create"); if (this.failCreate) throw new Error("network unavailable"); }
	async uploadMedia() { this.calls.push("upload"); if (this.failUpload) throw new Error("local photo unavailable"); }
	async publish() { this.calls.push("publish"); }
	async delete() { this.calls.push("delete"); }
	async listMine() { return { items: [] }; }
	async listCoffee() { return { items: [] }; }
}
class AppliedCommandStatusGateway {
	async getStatus() { return { status: "APPLIED" as const }; }
}
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

it.each([
	["http", "EXPERIENCE_NOT_FOUND"], ["polling", "EXPERIENCE_NOT_FOUND"],
	["http", "EXPERIENCE_NOT_OWNER"], ["polling", "EXPERIENCE_NOT_OWNER"],
])("reconciles explicit %s rejection %s without confusing absence and ownership", async (transport, rejectionCode) => {
	class AbsentExperienceGateway extends RecordingExperienceGateway {
		override async delete() {
			if (transport === "http") throw new GatewayError("business", "Rejected", 422, "COMMAND_REJECTED", rejectionCode);
		}
	}
	class AbsentCommandStatusGateway {
		async getStatus() { return { status: "REJECTED", rejectionCode, reason: "Rejected" }; }
	}
	let now = Date.now();
	const clock = jest.spyOn(Date, "now").mockImplementation(() => now);
	try {
		const deps: DependenciesWl = { gateways: { authToken: new FakeAuthTokenBridge("token", "user_test") as any, experiences: new AbsentExperienceGateway() as any, commandStatus: new AbsentCommandStatusGateway() as any }, helpers: makeFixedHelpers() };
		const store = initReduxStoreWl({ dependencies: deps, listeners: [experienceWriteListenerFactory(deps).middleware, processOutboxFactory(deps).middleware, outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: false })] });
		seedSignedIn(store, { userId: "user_test" }); seedBootReady(store); seedOnline(store);
		store.dispatch(experienceOptimisticCreated({ entity: { experienceId: "phantom", userId: "user_test", coffeeId: "c", message: "Ancienne entrée", status: "PUBLISHED", moderationStatus: "VISIBLE", version: 0, createdAt: "2026-09-14T10:00:00Z", updatedAt: "2026-09-14T10:00:00Z" } }));
		store.dispatch(uiExperienceDeleteRequested({ experienceId: "phantom" }));
		await flush();
		now += 60_000; store.dispatch(outboxWatchdogTick()); await flush();
		if (rejectionCode === "EXPERIENCE_NOT_FOUND") {
			expect(store.getState().exState.entities.entities.phantom).toBeUndefined();
			expect(store.getState().exState.mine.ids).not.toContain("phantom");
		} else {
			expect(store.getState().exState.entities.entities.phantom.status).toBe("PUBLISHED");
		}
		expect(Object.keys(store.getState().oState.byId)).toHaveLength(0);
	} finally { clock.mockRestore(); }
});

it.each([false, true])("deletes with pending media (upload already failed: %s), using runtime retries and canonical ACKs only", async deleteAfterFailedUpload => {
	let now = Date.now();
	const clock = jest.spyOn(Date, "now").mockImplementation(() => now);
	try {
		let sequence = 0;
		const experiences = new RecordingExperienceGateway();
		const deps: DependenciesWl = { gateways: { authToken: new FakeAuthTokenBridge("token", "user_test") as any, experiences: experiences as any, commandStatus: new AppliedCommandStatusGateway() as any }, helpers: { ...makeFixedHelpers(), currentUserId: () => "user_test" as any, currentUserProfile: () => ({ displayName: "Nicolas" }) as any, newCommandId: () => `cmd-${++sequence}` as any } };
		const store = initReduxStoreWl({ dependencies: deps, listeners: [experienceWriteListenerFactory(deps).middleware, processOutboxFactory(deps).middleware, outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: false })] });
		seedSignedIn(store, { userId: "user_test" }); seedBootReady(store); seedOnline(store);
		store.dispatch(uiExperienceCreateRequested({ coffeeId: "c", message: "Visite", photo: { localUri: "file:///photo.jpg", size: 42, contentType: "image/jpeg" } }));
		await flush();
		const experienceId = store.getState().exState.mine.ids[0];
		if (deleteAfterFailedUpload) {
			experiences.failCreate = false;
			experiences.failUpload = true;
			for (let tick = 0; tick < 2; tick++) {
				now += 60_000; store.dispatch(outboxWatchdogTick()); await flush();
			}
			expect(experiences.calls).toEqual(["create", "create", "upload"]);
		}
		store.dispatch(uiExperienceDeleteRequested({ experienceId }));
		await flush();
		if (!deleteAfterFailedUpload) expect(experiences.calls).toEqual(["create"]);
		expect(store.getState().exState.entities.entities[experienceId].status).toBe("DELETED");
		experiences.failCreate = false;
		for (let tick = 0; tick < 10; tick++) {
			now += 60_000;
			store.dispatch(outboxWatchdogTick());
			await flush();
		}
		expect(experiences.calls).toEqual(deleteAfterFailedUpload ? ["create", "create", "upload", "delete"] : ["create", "create", "delete"]);
		expect(Object.keys(store.getState().oState.byId)).toHaveLength(0);
		expect(store.getState().exState.entities.entities[experienceId].status).toBe("DELETED");
	} finally { clock.mockRestore(); }
});
