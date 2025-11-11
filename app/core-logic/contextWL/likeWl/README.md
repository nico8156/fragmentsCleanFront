# Likes domain overview

This folder hosts the Redux slice and use cases that keep the like counters in sync with the server while preserving a responsive UI through optimistic updates.

## Gateway contract
- [`likeWl.gateway.ts`](./gateway/likeWl.gateway.ts) defines the `LikeWlGateway` port implemented by the API layer.
  - `get({ targetId, signal })` → resolves with `{ count, me, version, serverTime? }` so the UI can hydrate the aggregate and mark freshness.
  - `add({ commandId, targetId, userId, at })` / `remove(...)` → idempotent commands invoked by the outbox processor.

## Reducer state
The slice stores aggregates under `state.likes.byTarget[targetId]` with the following fields:
- `count` / `me` / `version` / `updatedAt` mirror the server-side aggregate returned by the gateway.
- `optimistic` flags pending local intents so the UI can show temporary counts.
- `loading` (`idle | pending | error | success`) and `error` provide fetch feedback.
- `lastFetchedAt` and `staleAfterMs` drive freshness heuristics (defaults to 60 s).

## Optimistic like toggle flow
1. [`likeToggleUseCase`](./usecases/write/likePressedUseCase.ts) reacts to `uiLikeToggleRequested`.
   - Dispatches `likeOptimisticApplied` or `unlikeOptimisticApplied` so the reducer updates the aggregate immediately.
   - Enqueues a committed outbox item with the corresponding `LikeAdd`/`LikeRemove` command plus rollback metadata.
   - Triggers `outboxProcessOnce` to let the background worker flush commands through the configured `LikeWlGateway`.
2. When the gateway succeeds, the server emits an ACK handled by [`ackLikesListener`](./usecases/read/ackLike.ts).
   - Dispatches `likeReconciled` to overwrite the local aggregate with authoritative counts/versions.
   - Drops the committed outbox entry via `dropCommitted`.
3. If the user navigates to a target without cached data, [`likesRetrieval`](./usecases/read/likeRetrieval.ts) fetches the aggregate using `LikeWlGateway.get` and hydrates the reducer.

See the sequence diagram in [`like.toggle.org.schema.mmd`](./like.toggle.org.schema.mmd) for a visual walkthrough of the toggle/ACK cycle.
