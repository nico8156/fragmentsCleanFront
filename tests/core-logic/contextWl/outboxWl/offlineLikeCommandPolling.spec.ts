import { runtimeListenerFactory } from "@/app/core-logic/contextWL/appWl/usecases/runtimeListenerFactory";
import { likeToggleUseCaseFactory, uiLikeToggleRequested } from "@/app/core-logic/contextWL/likeWl/usecases/write/likePressedUseCase";
import { outboxWatchdogFactory } from "@/app/core-logic/contextWL/outboxWl/observation/outboxWatchdogFactory";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { outboxWatchdogTick } from "@/app/core-logic/contextWL/outboxWl/typeAction/outboxWatchdog.actions";
import { statusTypes } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import type { DependenciesWl } from "@/app/store/appStateWl";
import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { FakeAuthTokenBridge } from "@/tests/core-logic/fakes/FakeAuthTokenBridge";
import { FakeLikesGateway } from "@/tests/core-logic/fakes/FakeLikesGateway";
import { seedBootReady, seedOffline, seedOnline, seedSignedIn } from "@/tests/core-logic/fakes/wlSeeds";
import { flush, makeFixedHelpers } from "@/tests/core-logic/fakes/wlTestHarness";

class AppliedCommandStatusGateway {
	calls: string[] = [];

	async getStatus(commandId: string) {
		this.calls.push(commandId);
		return { status: "APPLIED" as const, appliedAt: "2025-10-10T07:03:31.000Z" };
	}
}

describe("offline like command polling fallback", () => {
	it("like offline -> reconnect -> HTTP 202 -> no socket -> /commands polling -> drop outbox", async () => {
		jest.spyOn(Date, "now").mockReturnValue(1_000_000);

		const authToken = new FakeAuthTokenBridge("token", "user_test");
		const likes = new FakeLikesGateway();
		const commandStatus = new AppliedCommandStatusGateway();

		const deps: DependenciesWl = {
			gateways: {
				authToken,
				likes,
				commandStatus,
			} as any,
			helpers: makeFixedHelpers({
				commandIds: ["11111111-1111-4111-8111-111111111111"],
				nowIso: "2025-10-10T07:03:00.000Z",
				userId: "user_test",
			}),
		};

		const store = initReduxStoreWl({
			dependencies: deps,
			listeners: [
				runtimeListenerFactory(),
				likeToggleUseCaseFactory(deps).middleware,
				processOutboxFactory(deps).middleware,
				outboxWatchdogFactory({ gateways: deps.gateways, enableTimer: false }),
			],
		});

		seedSignedIn(store, { userId: "user_test" });
		seedBootReady(store);
		seedOffline(store);
		await flush();

		store.dispatch(uiLikeToggleRequested({ targetId: "cafe_A" }));
		await flush();

		expect(likes.addCalls).toHaveLength(0);
		expect(store.getState().oState.queue).toHaveLength(1);

		seedOnline(store);
		await flush();
		await flush();

		expect(likes.addCalls).toEqual([
			{
				commandId: "11111111-1111-4111-8111-111111111111",
				targetId: "cafe_A",
				at: "2025-10-10T07:03:00.000Z",
			},
		]);

		const outboxId = store.getState().oState.byCommandId["11111111-1111-4111-8111-111111111111"];
		expect(outboxId).toBeTruthy();
		expect(store.getState().oState.byId[outboxId].status).toBe(statusTypes.awaitingAck);

		jest.spyOn(Date, "now").mockReturnValue(1_030_001);
		store.dispatch(outboxWatchdogTick());
		await flush();

		expect(commandStatus.calls).toEqual(["11111111-1111-4111-8111-111111111111"]);
		expect(store.getState().oState.byCommandId["11111111-1111-4111-8111-111111111111"]).toBeUndefined();
		expect(store.getState().oState.byId[outboxId]).toBeUndefined();
	});
});
