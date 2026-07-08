# Offline Readiness

Offline readiness covers reads, images, auth continuity, projection freshness, and queued writes. The backend remains the source of truth, but the mobile app must keep useful local state across airplane mode, process death, app backgrounding, and missed socket events.

## Read Models

The durable read-model cache is rehydrated during bootstrap after the outbox and before warmup reads.

Persisted slices:
- coffees
- coffee photo metadata
- opening hours
- articles
- comments
- likes
- tickets
- entitlements

The cache stores Redux read shapes, not backend DTOs. Reducers accept `READ_MODEL_CACHE/REHYDRATED` and replace only the slices present in the snapshot.

## Images

Cafe images use the image cache gateway and the native image disk cache. Photo metadata is part of the read-model cache; image bytes remain a native cache concern.

Rules:
- screens render image state, not cache policy
- photo retrieval may trigger cache warming through a listener
- offline image display depends on previously cached native bytes or cached local URI

## Auth

Expired access tokens are not enough to sign out offline users.

Refresh failures are retryable when caused by:
- network/offline errors
- timeout or abort
- HTTP 408 or 429
- HTTP 5xx

On those failures the app keeps `SecureStore`, keeps Redux session state, and retries after runtime events. Explicit auth rejection remains terminal.

## Projection Sync

Projection sync is opportunistic freshness. It persists the latest projection event cursor through `SyncMetaStorage` and reconnects with that cursor after app restart.

Projection events may trigger read refreshes for comments, likes, tickets, and entitlements. They do not drop outbox commands and do not replace command status polling.

## Tests

Offline readiness tests should cover:
- cold start from durable read cache without network
- expired token while offline keeps the session
- reconnect dispatches refresh, user hydration, outbox resume, command polling, and projection sync
- projection sync resumes from persisted cursor
