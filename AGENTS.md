# AGENTS.md - Fragments Mobile

## Authority

This document governs the React Native / Expo mobile app in `/Users/nicolasmaldiney/fragmentsCleanFront`.

It must be read together with the backend doctrine in `/Users/nicolasmaldiney/fragmentsClean/AGENTS.md`.

## Mission

Fragments Mobile owns the user experience.

The backend remains the source of truth. The mobile app makes that truth usable under real mobile constraints: offline mode, foreground/background transitions, app restarts, slow networks, missed socket messages, and eventual consistency.

## Architecture

Required dependency direction:

```text
Screen
-> ViewModel hook
-> Redux selector / listener / thunk
-> Gateway port
-> Secondary adapter
-> Backend / native API
```

Reverse dependencies are forbidden.

## Active Client Contexts

- `appWl`: runtime, boot, connectivity, foreground/background.
- `userWl`: auth session, profile, badges.
- `coffeeWl`: coffee catalog and detail state.
- `articleWl`: editorial read state.
- `likeWl`: like state and ACK reconciliation.
- `commentWl`: comment state and ACK reconciliation.
- `ticketWl`: ticket submission and verification state.
- `outboxWl`: local durable command queue.
- `wsWl`: opportunistic WebSocket lifecycle.
- `locationWl`: device location.
- `entitlementWl`: product capabilities/rewards.

## Screen Rules

Screens:
- render UI
- call view model callbacks
- handle visual loading/error/empty/success states

Screens must not:
- call `fetch`
- instantiate gateways
- dispatch deep business actions directly when a view model exists
- contain offline/retry/ACK logic
- contain backend DTO mapping

## ViewModel Rules

View models:
- select state through selectors
- derive UI-ready values
- expose user actions
- trigger reads/writes through Redux actions
- hide incomplete store shapes from screens

View models must not:
- instantiate concrete gateways
- call HTTP directly
- own business invariants
- duplicate reducer transitions

## Redux / Use Case Rules

Redux is the application event bus.

Listeners and thunks:
- react to UI intentions and runtime events
- validate inputs
- create command IDs
- dispatch optimistic reducers
- enqueue outbox commands
- trigger processing
- route ACKs into reconcile/rollback actions

Action names should express intent or facts, not implementation details.

## Gateway Rules

Gateway ports define what the app needs.

Secondary adapters implement:
- HTTP
- WebSocket/STOMP
- SecureStore
- MMKV/outbox/read-model/sync metadata storage
- NetInfo
- AppState
- Location
- Image picker/OCR-related native APIs

Concrete gateways are wired in `app/adapters/primary/wiring`.

Do not create concrete gateways in screens, view models, or core logic.

## Offline-First Write Flow

Every critical write follows:

```text
UI intent
-> Redux listener/use case
-> validation
-> optimistic reducer
-> local outbox
-> HTTP command
-> awaiting ACK
-> WebSocket ACK if available
-> /commands/{commandId} polling fallback
-> reconcile or rollback
-> drop outbox record
```

## Rollback Policy

Do not rollback on:
- offline
- network error
- timeout
- 5xx
- 401/403 transport/auth errors from a write gateway
- missed socket ACK
- app backgrounding

On those cases:
- keep optimistic UI
- keep command in outbox
- retry with backoff
- let command status polling decide later

Rollback only on:
- explicit business rejection from backend
- `GET /commands/{commandId}` returning `REJECTED`

`PENDING` means wait and check again.

Write gateways must throw typed gateway errors where possible. The outbox processor treats `business` errors as rollback candidates and treats `network`, `auth`, `server`, and unknown transport failures as retryable.

## WebSocket Policy

WebSocket is opportunistic.

It may:
- speed up ACK delivery
- improve perceived responsiveness
- trigger reconcile/drop sooner

It must not:
- be the only source of command truth
- mutate Redux state directly from the gateway
- carry business invariants
- replace command status polling

The WebSocket gateway parses and validates transport payloads, then dispatches Redux ACK actions through listeners.

Projection sync must persist its cursor through `SyncMetaStorage`. Reconnects must resume from the stored cursor when the gateway has no fresher in-memory `lastEventId`.

## Command Status Policy

`/commands/{commandId}` is mandatory fallback.

The outbox watchdog checks this endpoint when an item is `awaitingAck` and no socket ACK has arrived.

Mobile behavior:
- `APPLIED`: reconcile/drop
- `REJECTED`: rollback/drop
- `PENDING`: keep awaiting and re-check later

## App Bootstrap Rules

App bootstrap must:
1. mount runtime adapters
2. mark hydration
3. initialize auth
4. rehydrate outbox
5. rehydrate durable read-model cache
6. process outbox if signed in and online
7. run non-critical warmup reads
8. mark warmup/boot success
9. clean up runtime adapters on unmount

Warmup data must not corrupt the outbox lifecycle.

## Offline Readiness

Durable read-model cache is part of the runtime contract. Coffee catalog, coffee photos metadata, opening hours, articles, comments, likes, tickets, and entitlements are persisted through the read cache and rehydrated before warmup reads.

Remote cafe images must use the image cache gateway or native disk cache. Screens may render cached image URIs, but must not own cache fetch or retry logic.

Auth refresh failures caused by offline mode, timeout, 408/429, or 5xx must keep the stored session. Only explicit auth rejection should clear SecureStore and sign the user out.

## Pass Policy

The backend owns Pass counters, thresholds, level status, and unlocked capabilities through the entitlements snapshot. Mobile may compute ring progress and presentation text from backend `counters`, `requirements`, and `levels`, but screens and components must not duplicate Pass thresholds or use optimistic local counts as the source of truth.

Use the shared Pass avatar/rings component for profile thumbnails that display earned levels. Do not duplicate SVG ring rendering or Pass colors in individual screens.

## Configuration and Secrets

No hardcoded production API URL.
No secrets in Expo config.
No tokens in logs.

Production values must come from:
- EAS env/secrets
- Expo public env for non-secret API base URL
- SecureStore for runtime auth/session material

## Test Policy

Expected tests:
- reducers are pure
- selectors are pure
- listeners/use cases use fake gateways
- outbox tests cover retry/awaiting ACK/drop/rollback
- socket ACK tests cover route/reconcile/drop
- bootstrap tests cover rehydration and runtime lifecycle
- offline readiness tests cover cold-start cache, expired-token offline refresh, reconnect refresh, and projection cursor resume
- critical flows are tested without real network

Mocks are allowed for native technical boundaries. Business ports should use named fakes.

## Explicit Prohibitions

- no `fetch` in screens
- no concrete gateway in view models
- no rollback on network failure
- no sign-out on transient refresh failure
- no socket as source of truth
- no API config hardcoded for prod
- no secret in Expo config
- no direct mutation outside reducers
- no command without `commandId`
- no write path that bypasses local outbox for critical user actions
