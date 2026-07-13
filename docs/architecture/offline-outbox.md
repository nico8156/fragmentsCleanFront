# Offline Outbox

The local outbox is the reliability boundary for mobile writes.

## Lifecycle

```text
queued
-> processing
-> awaitingAck
-> dropped after APPLIED
```

On transport failure:
- mark failure for observability
- schedule retry
- keep optimistic UI

Transport failure includes offline mode, network errors, timeouts, missed socket ACKs, 5xx, and auth/transport errors emitted by write gateways.

On business rejection:
- rollback
- drop command

Write gateways should throw typed gateway errors. Only explicit `business` rejection can trigger rollback from immediate command processing; command status `REJECTED` is the canonical terminal rejection.

## Dev Observability

Outbox logs use the `[OUTBOX_TRACE]` prefix for the command lifecycle:

```text
send:start -> ack:awaiting -> ack:check -> ack:verdict -> reconcile/drop
                                      \-> rollback/drop
                                      \-> PENDING -> next ack:check
```

Projection refreshes are logged separately as `projection:refresh_requested` for
`comments`, `likes`, `tickets`, and `entitlements`. These logs explain why a read
model is refreshed, but they are not command ACKs and must not drop outbox records.

In development builds, the console exposes:

```ts
globalThis.__FRAGMENTS_DEV__.printOutbox()
await globalThis.__FRAGMENTS_DEV__.clearOutbox()
```

`clearOutbox` clears the durable outbox storage and dispatches
`OUTBOX/DEV_CLEAR_COMMITTED`. It exists only to remove local development residue;
production recovery must continue to rely on `/commands/{commandId}`.

## Required Data

Each command stores:
- internal outbox id
- `commandId`
- command kind
- command payload
- undo payload
- attempts
- next retry/check time

## Critical Rule

Network failure is not business failure.
