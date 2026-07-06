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
2. The outbox watchdog reconciles command completion through `/commands/{commandId}`.
   - `APPLIED` drops the committed outbox entry.
   - `REJECTED` rolls back using the command undo payload, then drops the entry.
3. After the backend updates `social_likes_projection`, projection sync emits `projection.updated` with `projection="likes"`, `scope="target"` and `entityId=targetId`.
4. `projectionSyncWl` dispatches [`likesRetrieval`](./usecases/read/likeRetrieval.ts), which fetches the authoritative aggregate using `LikeWlGateway.get` and hydrates the reducer.

Projection freshness and command completion remain separate paths.
