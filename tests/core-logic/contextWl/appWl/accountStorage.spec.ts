import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import { accountStorageMiddleware } from "@/app/core-logic/contextWL/appWl/runtime/accountStorageMiddleware";
import { accountStorageRetry, createListenerMiddleware } from "@/app/core-logic/contextWL/appWl/runtime/accountScope";
import { authSessionLoaded, authSignedOut } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";
import { ticketOptimisticCreated, ticketRetrieved } from "@/app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer";
import { enqueueCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { processOutboxFactory } from "@/app/core-logic/contextWL/outboxWl/processOutbox";
import { coffeeExperiencesReceived, experienceOptimisticReported } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import { createAction } from "@reduxjs/toolkit";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
class AccountStorage {
  values = new Map<string, any>();
  reads: (string | undefined)[] = [];
  fail = false;
  async loadSnapshot(userId?: string) {
    this.reads.push(userId);
    if (this.fail) throw new Error("storage unavailable");
    return this.values.get(userId ?? "legacy") ?? null;
  }
  async saveSnapshot(snapshot: any, userId?: string) {
    if (this.fail) throw new Error("storage unavailable");
    this.values.set(userId ?? "legacy", JSON.parse(JSON.stringify(snapshot)));
  }
  async clear(userId?: string) { this.values.delete(userId ?? "legacy"); }
}
const login = (store: any, userId: string) => store.dispatch(authSessionLoaded({ session: { userId } as any }));
const ticket = () => ticketOptimisticCreated({ ticketId: "ticket-A", at: "2026-09-11T10:00:00Z", ocrText: "private A" } as any);
const enqueue = () => enqueueCommitted({ id: "record-A", enqueuedAt: "2026-09-11T10:00:00Z", item: {
  command: { kind: "Ticket.Verify", commandId: "command-A", ticketId: "ticket-A", ocrText: "private A", at: "2026-09-11T10:00:00Z" },
  undo: { kind: "Ticket.Verify", ticketId: "ticket-A" },
} } as any);
const setup = (outbox = new AccountStorage(), cache = new AccountStorage()) => ({
  outbox, cache,
  store: initReduxStoreWl({ dependencies: {}, accountStorageManaged: true,
    extraMiddlewares: [accountStorageMiddleware({ outbox, cache })] }),
});

describe("durable per-account state", () => {
  it("A -> B -> A preserves A's offline ticket and command without exposing them to B", async () => {
    const { store, outbox, cache } = setup();
    login(store, "A"); await flush();
    store.dispatch(ticket()); store.dispatch(enqueue());
    store.dispatch(authSignedOut()); login(store, "B"); await flush();
    expect(store.getState().tState.byId).toEqual({});
    expect(store.getState().oState.byId).toEqual({});
    login(store, "A"); await flush();
    expect(Object.values(store.getState().tState.byId)[0]?.ocrText).toBe("private A");
    expect(store.getState().oState.queue).toEqual(["record-A"]);
    const restarted = setup(outbox, cache).store;
    login(restarted, "A"); await flush();
    expect(restarted.getState().oState.queue).toEqual(["record-A"]);
    expect(outbox.reads).not.toContain(undefined);
  });

  it("does not infer the owner of legacy snapshots or delete them", async () => {
    const outbox = new AccountStorage();
    outbox.values.set("legacy", { byId: { old: { secret: true } } });
    const { store } = setup(outbox);
    login(store, "B"); await flush();
    expect(store.getState().oState.byId).toEqual({});
    expect(outbox.values.get("legacy")).toEqual({ byId: { old: { secret: true } } });
  });

  it("restores cached experience visibility and personal reports only for their owner", async () => {
    const { store, outbox, cache } = setup();
    login(store, "A"); await flush();
    store.dispatch(coffeeExperiencesReceived({ coffeeId: "coffee-1", page: { items: [{
      experienceId: "experience-1", userId: "author-1", coffeeId: "coffee-1",
      authorName: "Auteur", message: "Expérience en cache", status: "PUBLISHED",
      moderationStatus: "VISIBLE", createdAt: "2026-09-12T08:00:00Z",
      updatedAt: "2026-09-12T08:00:00Z", version: 1,
    }], nextCursor: null } }));
    store.dispatch(experienceOptimisticReported({ experienceId: "experience-1" }));
    await flush();

    const restartedA = setup(outbox, cache).store;
    login(restartedA, "A"); await flush();
    expect(restartedA.getState().exState.entities.entities["experience-1"]?.message).toBe("Expérience en cache");
    expect(restartedA.getState().exState.reportedIds["experience-1"]).toBe(true);

    const restartedB = setup(outbox, cache).store;
    login(restartedB, "B"); await flush();
    expect(restartedB.getState().exState.entities.entities["experience-1"]).toBeUndefined();
    expect(restartedB.getState().exState.reportedIds).toEqual({});
  });

  it("ignores a late A hydration after B has loaded", async () => {
    const { outbox, cache } = setup();
    const delayed = deferred<any>();
    outbox.loadSnapshot = async userId => userId === "A" ? delayed.promise : null;
    const { store } = setup(outbox, cache);
    login(store, "A"); login(store, "B"); await flush();
    delayed.resolve({ byId: {}, queue: [], byCommandId: {}, suspended: true }); await flush();
    expect(store.getState().oState.suspended).toBe(false);
    expect(store.getState().aState.session?.userId).toBe("B");
    expect(store.getState().accountScope.ready).toBe(true);
  });

  it("fails closed on unreadable storage, leaves it intact and supports retry", async () => {
    const { store, outbox } = setup();
    outbox.fail = true;
    login(store, "A"); await flush();
    expect(store.getState().accountScope.ready).toBe(false);
    expect(store.getState().accountScope.error).toBeTruthy();
    store.dispatch(ticket());
    expect(store.getState().tState.byId).toEqual({});
    expect(outbox.values.size).toBe(0);
    outbox.fail = false;
    store.dispatch(accountStorageRetry()); await flush();
    expect(store.getState().accountScope.ready).toBe(true);
  });

  it("retains an unsaved command in memory and persists it on retry", async () => {
    const { store, outbox } = setup();
    login(store, "A"); await flush();
    outbox.fail = true;
    store.dispatch(enqueue()); await flush();
    expect(store.getState().accountScope.ready).toBe(false);
    store.dispatch(authSignedOut()); login(store, "B"); await flush();
    outbox.fail = false;
    login(store, "A"); await flush();
    expect(store.getState().oState.queue).toEqual(["record-A"]);
  });
});

describe("late session work", () => {
  it("lets B send while A's token request is still pending", async () => {
    const delayedA = deferred<string>();
    let calls = 0;
    const verify = jest.fn(async () => undefined);
    const gateways = { authToken: { getAccessToken: () => ++calls === 1 ? delayedA.promise : Promise.resolve("B-token") },
      tickets: { verify } } as any;
    const processor = processOutboxFactory({ gateways } as any);
    const store = initReduxStoreWl({ dependencies: { gateways }, listeners: [processor.middleware] });
    login(store, "A"); store.dispatch(enqueue()); store.dispatch(outboxProcessOnce());
    login(store, "B");
    const commandB = enqueue();
    commandB.payload.item.command.commandId = "command-B" as any;
    store.dispatch(commandB); store.dispatch(outboxProcessOnce()); await flush();
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0]).toEqual([expect.objectContaining({ commandId: "command-B" })]);
    delayedA.resolve("A-token"); await flush();
    expect(verify).toHaveBeenCalledTimes(1);
  });
  it("discards a thunk response even if the user returns to A", async () => {
    const store = initReduxStoreWl({ dependencies: {} });
    const delayed = deferred<void>();
    login(store, "A");
    const task = store.dispatch<any>(async (dispatch: any) => {
      await delayed.promise;
      dispatch(ticketRetrieved({ ticketId: "ticket-A", status: "CONFIRMED", version: 1 } as any));
    });
    store.dispatch(authSignedOut()); login(store, "A");
    delayed.resolve(); await task;
    expect(store.getState().tState.byId).toEqual({});
  });

  it("discards a callback retained by a listener after signout", async () => {
    const listener = createListenerMiddleware();
    const action = createAction("test/register");
    let callback!: () => void;
    listener.startListening({ actionCreator: action, effect: (_, api) => {
      callback = () => api.dispatch(ticket());
    } });
    const store = initReduxStoreWl({ dependencies: {}, listeners: [listener.middleware] });
    login(store, "A"); store.dispatch(action()); store.dispatch(authSignedOut());
    callback();
    expect(store.getState().tState.byId).toEqual({});
  });

  it("does not send A's command when token retrieval completes after login B", async () => {
    const token = deferred<string>();
    const verify = jest.fn();
    const gateways = { authToken: { getAccessToken: () => token.promise }, tickets: { verify } } as any;
    const processor = processOutboxFactory({ gateways } as any);
    const store = initReduxStoreWl({ dependencies: { gateways }, listeners: [processor.middleware] });
    login(store, "A"); store.dispatch(enqueue()); store.dispatch(outboxProcessOnce());
    login(store, "B"); token.resolve("B-token"); await flush();
    expect(verify).not.toHaveBeenCalled();
    expect(store.getState().oState.byId).toEqual({});
  });
});
