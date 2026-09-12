import type { Middleware } from "@reduxjs/toolkit";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import type { OutboxStorageGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/outboxStorage.gateway";
import type { ReadModelCacheGateway } from "../gateway/readModelCache.gateway";
import { buildSnapshot } from "./readModelCachePersistenceFactory";
import { readModelCacheRehydrated } from "../typeAction/readModelCache.action";
import { sanitizeOutboxState } from "@/app/core-logic/contextWL/outboxWl/runtime/rehydrateOutbox";
import { outboxRehydrateCommitted, outboxProcessOnce } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import { accountGeneration, accountIsReady, accountStorageFailed, accountStorageReady, accountStorageRetry } from "./accountScope";
import { authSessionLoaded, authSignedOut } from "@/app/core-logic/contextWL/userWl/typeAction/user.action";

// Account ids are explicit arguments: an async save can never follow a mutable
// "current user" pointer. Legacy unowned snapshots are deliberately left intact.
export const accountStorageMiddleware = (deps: {
  outbox: OutboxStorageGateway;
  cache: ReadModelCacheGateway;
}): Middleware<object, RootStateWl> => api => {
  const writes = new Map<string, Promise<void>>();
  const retained = new Map<string, RootStateWl>();
  let restoreAttempt = 0;
  const fail = (generation: number) => api.dispatch(accountStorageFailed({
    generation, error: "Les données locales ne sont pas accessibles. Réessaie avant de continuer.",
  }));
  const persist = (state: RootStateWl) => {
    const userId = state.aState.session?.userId;
    if (!userId) return;
    retained.set(userId, state);
    const save = (writes.get(userId) ?? Promise.resolve()).catch(() => undefined).then(async () => {
      await deps.outbox.saveSnapshot(state.oState, userId);
      await deps.cache.saveSnapshot(buildSnapshot(state), userId);
    });
    writes.set(userId, save);
    void save.catch(() => fail(accountGeneration(state)));
  };
  const restore = async () => {
    const attempt = ++restoreAttempt;
    const state = api.getState();
    const generation = accountGeneration(state);
    const userId = state.aState.session?.userId;
    const current = () => attempt === restoreAttempt && generation === accountGeneration(api.getState());
    if (!userId) {
      api.dispatch(accountStorageReady({ generation }));
      return;
    }
    try {
      // Wait for A's final save before loading A again. A failed write keeps an
      // in-memory snapshot and is retried; it must not become an empty outbox.
      const memory = retained.get(userId);
      if (memory) persist(memory);
      await writes.get(userId);
      const [outbox, cache] = await Promise.all([
        deps.outbox.loadSnapshot(userId), deps.cache.loadSnapshot(userId),
      ]);
      if (!current()) return;
      const sanitized = sanitizeOutboxState(outbox);
      if (outbox && (!outbox.byId || !Array.isArray(outbox.queue) ||
          Object.keys(sanitized.byId).length !== Object.keys(outbox.byId).length)) {
        throw new Error("Invalid account outbox snapshot");
      }
      if (cache) api.dispatch(readModelCacheRehydrated(cache));
      api.dispatch(outboxRehydrateCommitted(sanitized));
      api.dispatch(accountStorageReady({ generation }));
      api.dispatch(outboxProcessOnce());
    } catch {
      if (current()) fail(generation);
    }
  };
  const changed = (before: RootStateWl, after: RootStateWl) =>
    (["oState", "tState", "cState", "exState", "lState", "scState", "enState", "cfState", "pState", "ohState", "arState"] as const)
      .some(key => before[key] !== after[key]);
  return next => action => {
    const before = api.getState();
    const result = next(action);
    const after = api.getState();
    const switched = accountGeneration(before) !== accountGeneration(after);
    if (switched && accountIsReady(before)) persist(before);
    if (switched || (!accountIsReady(after) && accountStorageRetry.match(action)) ||
        (!accountIsReady(after) && (authSessionLoaded.match(action) || authSignedOut.match(action)))) {
      void restore();
    } else if (accountIsReady(after) && changed(before, after)) {
      persist(after);
    }
    return result;
  };
};
