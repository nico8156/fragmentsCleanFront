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

On business rejection:
- rollback
- drop command

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

