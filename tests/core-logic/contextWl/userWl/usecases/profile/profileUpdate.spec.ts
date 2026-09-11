import { profileUpdateListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/profile/profileUpdateListenerFactory";
import { avatarAttachRequested, avatarRemoveRequested, profileUpdateRequested } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { authUserHydrationSucceeded } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { commandKinds } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import { makeFixedHelpers, makeStoreWl, flush } from "@/tests/core-logic/fakes/wlTestHarness";

const user = {
	id: "11111111-1111-4111-8111-111111111111" as any,
	createdAt: "2026-09-11T10:00:00Z" as any,
	updatedAt: "2026-09-11T10:00:00Z" as any,
	displayName: "Nicolas",
	identities: [],
	roles: ["user"] as const,
	version: 3,
};

describe("profileUpdateListenerFactory", () => {
	it("updates optimistically and enqueues a durable user-profile command", async () => {
		const helpers = makeFixedHelpers({
			commandIds: ["22222222-2222-4222-8222-222222222222"],
			nowIso: "2026-09-11T11:00:00Z",
		});
		const listener = profileUpdateListenerFactory({ gateways: {}, helpers });
		const store = makeStoreWl({ deps: { gateways: {}, helpers }, listeners: [listener.middleware] });
		store.dispatch(authUserHydrationSucceeded({ user: user as any }));

		store.dispatch(profileUpdateRequested({ displayName: "  Nicolas   Maldiney " }));
		await flush();

		expect(store.getState().aState.currentUser?.displayName).toBe("Nicolas Maldiney");
		expect(store.getState().aState.profileMutationStatus).toBe("pending");
		const record = Object.values(store.getState().oState.byId)[0];
		expect(record.item.command).toEqual({
			kind: commandKinds.UserProfileUpdate,
			commandId: "22222222-2222-4222-8222-222222222222",
			displayName: "Nicolas Maldiney",
			at: "2026-09-11T11:00:00Z",
		});
		expect(record.item.undo).toEqual({
			kind: commandKinds.UserProfileUpdate,
			displayName: "Nicolas",
			version: 3,
		});
	});

	it("rejects invalid input locally without changing or enqueueing", async () => {
		const helpers = makeFixedHelpers();
		const listener = profileUpdateListenerFactory({ gateways: {}, helpers });
		const store = makeStoreWl({ deps: { gateways: {}, helpers }, listeners: [listener.middleware] });
		store.dispatch(authUserHydrationSucceeded({ user: user as any }));

		store.dispatch(profileUpdateRequested({ displayName: "x" }));
		await flush();

		expect(store.getState().aState.currentUser?.displayName).toBe("Nicolas");
		expect(store.getState().aState.profileMutationStatus).toBe("error");
		expect(store.getState().oState.queue).toEqual([]);
	});

	it("updates the avatar optimistically and persists its local file in the outbox command", async () => {
		const helpers = makeFixedHelpers({ commandIds: ["media-id", "command-id"] });
		const listener = profileUpdateListenerFactory({ gateways: {}, helpers });
		const store = makeStoreWl({ deps: { gateways: {}, helpers }, listeners: [listener.middleware] });
		store.dispatch(authUserHydrationSucceeded({ user: { ...user, avatarUrl: "https://old.test/avatar.jpg" } as any }));
		store.dispatch(avatarAttachRequested({ image: { localUri: "file:///private/avatar.jpg", contentType: "image/jpeg", size: 2048 } }));
		await flush();

		expect(store.getState().aState.currentUser?.avatarUrl).toBe("file:///private/avatar.jpg");
		const record = Object.values(store.getState().oState.byId)[0];
		expect(record.item.command).toMatchObject({ kind: commandKinds.UserAvatarAttach, mediaId: "command-id", image: { size: 2048 } });
		expect(record.item.undo).toMatchObject({ avatarUrl: "https://old.test/avatar.jpg", version: 3 });
	});

	it("queues avatar removal without discarding the rollback value", async () => {
		const helpers = makeFixedHelpers({ commandIds: ["remove-command"] });
		const listener = profileUpdateListenerFactory({ gateways: {}, helpers });
		const store = makeStoreWl({ deps: { gateways: {}, helpers }, listeners: [listener.middleware] });
		store.dispatch(authUserHydrationSucceeded({ user: { ...user, avatarUrl: "https://old.test/avatar.jpg" } as any }));
		store.dispatch(avatarRemoveRequested());
		await flush();

		expect(store.getState().aState.currentUser?.avatarUrl).toBeUndefined();
		const record = Object.values(store.getState().oState.byId)[0];
		expect(record.item.command).toMatchObject({ kind: commandKinds.UserAvatarRemove, commandId: "remove-command" });
		expect(record.item.undo).toMatchObject({ avatarUrl: "https://old.test/avatar.jpg" });
	});
});
