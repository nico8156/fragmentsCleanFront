import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { authSessionLoaded, authSignedOut } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { ticketOptimisticCreated } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import { permissionUpdated } from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";

describe("account isolation", () => {
  it("clears private tickets when signing out and switching account", () => {
    const store = initReduxStoreWl({ dependencies: {} });
    store.dispatch(authSessionLoaded({ session: { userId: "A" } as any }));
    store.dispatch(ticketOptimisticCreated({ ticketId: "ticket-A", at: "2026-09-11T10:00:00Z" } as any));
    store.dispatch(authSignedOut());
    expect(store.getState().tState.byId).toEqual({});
    store.dispatch(authSessionLoaded({ session: { userId: "B" } as any }));
    expect(store.getState().tState.byId).toEqual({});
  });

  it.each(["granted", "denied", "undetermined"] as const)("preserves permission %s", (status) => {
    const store = initReduxStoreWl({ dependencies: {} });
    store.dispatch(permissionUpdated({ status }));
    expect(store.getState().lcState.permission).toBe(status);
  });
});
