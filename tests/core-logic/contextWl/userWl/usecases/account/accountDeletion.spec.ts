import { accountDeletionListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/account/accountDeletionListenerFactory";
import { accountDeletionRequested, authSessionLoaded } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { makeFixedHelpers, makeStoreWl, flush } from "@/tests/core-logic/fakes/wlTestHarness";

const session = {
	userId: "11111111-1111-4111-8111-111111111111" as any,
	provider: "google" as const,
	scopes: [],
	establishedAt: 1,
	tokens: { expiresAt: Date.now() + 60_000 },
};

describe("accountDeletionListenerFactory", () => {
	it("waits for durable backend acceptance before requesting local sign-out", async () => {
		const users = { getById: jest.fn(), updateProfile: jest.fn(), requestAccountDeletion: jest.fn().mockResolvedValue(undefined) };
		const helpers = makeFixedHelpers({ commandIds: ["22222222-2222-4222-8222-222222222222"] });
		const listener = accountDeletionListenerFactory({ gateways: { users } as any, helpers });
		const store = makeStoreWl({ deps: { gateways: { users } as any, helpers }, listeners: [listener.middleware] });
		store.dispatch(authSessionLoaded({ session }));

		store.dispatch(accountDeletionRequested());
		await flush();

		expect(users.requestAccountDeletion).toHaveBeenCalledWith({ commandId: "22222222-2222-4222-8222-222222222222" });
		expect(store.getState().aState.session).toBeUndefined();
		expect(store.getState().aState.accountDeletionStatus).toBe("idle");
		expect(store.getState().aState.accountDeletionCommandId).toBeUndefined();
	});

	it("keeps the session and command id when delivery is technically uncertain", async () => {
		const users = { getById: jest.fn(), updateProfile: jest.fn(), requestAccountDeletion: jest.fn().mockRejectedValue(new Error("network")) };
		const helpers = makeFixedHelpers({ commandIds: ["22222222-2222-4222-8222-222222222222"] });
		const listener = accountDeletionListenerFactory({ gateways: { users } as any, helpers });
		const store = makeStoreWl({ deps: { gateways: { users } as any, helpers }, listeners: [listener.middleware] });
		store.dispatch(authSessionLoaded({ session }));

		store.dispatch(accountDeletionRequested());
		await flush();

		expect(store.getState().aState.accountDeletionStatus).toBe("error");
		expect(store.getState().aState.accountDeletionCommandId).toBe("22222222-2222-4222-8222-222222222222");
		expect(store.getState().aState.session).toBeDefined();
	});
});
