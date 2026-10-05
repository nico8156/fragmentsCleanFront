import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { selectBlockedUsers } from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import { blockOptimisticApplied, unblockOptimisticApplied, blockedUsersPending } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";

describe("blocked users selection", () => {
    it("keeps the same reference for unchanged users, including loading updates", () => {
        const store = initReduxStoreWl({ dependencies: {} });
        const initial = selectBlockedUsers(store.getState());
        expect(initial).toEqual([]);
        expect(selectBlockedUsers(store.getState())).toBe(initial);
        store.dispatch(blockedUsersPending());
        expect(selectBlockedUsers(store.getState())).toBe(initial);
    });

    it("updates the list after blocking and unblocking without losing identity data", () => {
        const store = initReduxStoreWl({ dependencies: {} });
        const initial = selectBlockedUsers(store.getState());
        const block = { blockId: "block", userId: "user", displayName: "Camille", blockedAt: "2026-10-05T10:00:00Z", version: 1 };
        store.dispatch(blockOptimisticApplied({ block }));
        const blocked = selectBlockedUsers(store.getState());
        expect(blocked).toEqual([block]);
        expect(blocked).not.toBe(initial);
        expect(selectBlockedUsers(store.getState())).toBe(blocked);
        store.dispatch(unblockOptimisticApplied({ userId: block.userId }));
        expect(selectBlockedUsers(store.getState())).toEqual([]);
    });
});
