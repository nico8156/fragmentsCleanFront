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
