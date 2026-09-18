import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { authListenerFactory } from "@/app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory";
import { initializeAuth, signOut } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";
import {
  authMaybeRefreshRequested,
  authSessionLoaded,
  authUserHydrationRequested,
} from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { FakeAuthSecureStore } from "@/app/adapters/secondary/gateways/fake/fakeAuthSecureStore";
import { makeDemoUser } from "@/app/adapters/secondary/gateways/fake/fakeUserRepo";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
const session = (userId = "A") => ({
  userId, provider: "google", establishedAt: 1, scopes: [],
  tokens: { accessToken: `${userId}-token`, expiresAt: Date.now() + 3_600_000, tokenType: "Bearer" },
} as any);
const setup = (auth: any) => {
  const onSessionChanged = jest.fn();
  const gateways = { auth } as any;
  return { onSessionChanged, store: initReduxStoreWl({ dependencies: { gateways },
    listeners: [authListenerFactory({ gateways, onSessionChanged })] }) };
};

it("a late secure-store load cannot sign the user back in after logout", async () => {
  const loaded = deferred<any>();
  const secureStore = new FakeAuthSecureStore();
  secureStore.loadSession = () => loaded.promise;
  const { store, onSessionChanged } = setup({ secureStore });
  store.dispatch(initializeAuth()); await flush();
  store.dispatch(signOut()); await flush();
  loaded.resolve(session()); await flush();
  expect(store.getState().aState.status).toBe("signedOut");
  expect(store.getState().aState.session).toBeUndefined();
  expect(onSessionChanged).toHaveBeenLastCalledWith(undefined);
});

it("a refresh finishing after logout cannot restore tokens or identity", async () => {
  const refreshed = deferred<any>();
  const secureStore = new FakeAuthSecureStore();
  const expired = session(); expired.tokens.expiresAt = 0;
  await secureStore.saveSession(expired);
  const { store, onSessionChanged } = setup({ secureStore,
    userRepo: { getById: async () => ({ ...makeDemoUser(), id: "A" }) },
    server: { refreshSession: () => refreshed.promise, logout: async () => undefined },
  });
  store.dispatch(initializeAuth()); await flush();
  store.dispatch(signOut()); await flush();
  refreshed.resolve({ session: session(), user: { ...makeDemoUser(), id: "A" } }); await flush();
  expect(store.getState().aState.session).toBeUndefined();
  expect(store.getState().aState.currentUser).toBeUndefined();
  expect(secureStore.snapshot()).toBeUndefined();
  expect(onSessionChanged).toHaveBeenLastCalledWith(undefined);
});

it("coalesces concurrent refresh requests into one server rotation", async () => {
  const refreshed = deferred<any>();
  const secureStore = new FakeAuthSecureStore();
  const expired = session();
  expired.tokens.expiresAt = 0;
  expired.tokens.refreshToken = "refresh-A";
  await secureStore.saveSession(expired);
  const refreshSession = jest.fn(() => refreshed.promise);
  const { store } = setup({
    secureStore,
    userRepo: { getById: async () => ({ ...makeDemoUser(), id: "A" }) },
    server: { refreshSession, logout: async () => undefined },
  });

  store.dispatch(initializeAuth());
  await flush();
  store.dispatch(authMaybeRefreshRequested());
  store.dispatch(authMaybeRefreshRequested());
  await flush();

  expect(refreshSession).toHaveBeenCalledTimes(1);
  refreshed.resolve({ session: session(), user: { ...makeDemoUser(), id: "A" } });
  await flush();
  expect(store.getState().aState.status).toBe("signedIn");
});

it("a late profile A cannot populate B even if its version is higher", async () => {
  const profile = deferred<any>();
  const { store } = setup({ userRepo: { getById: () => profile.promise } });
  store.dispatch(authSessionLoaded({ session: session("A") }));
  store.dispatch(authUserHydrationRequested({ userId: "A" } as any));
  store.dispatch(authSessionLoaded({ session: session("B") }));
  profile.resolve({ ...makeDemoUser(), id: "A", version: 999 }); await flush();
  expect(store.getState().aState.session?.userId).toBe("B");
  expect(store.getState().aState.currentUser).toBeUndefined();
});
