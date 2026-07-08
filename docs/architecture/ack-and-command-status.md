# Command Status

Fragments mobile uses one canonical command lifecycle path.

Command reconciliation:

```text
outbox watchdog -> GET /commands/{commandId} -> APPLIED/REJECTED/PENDING
```

## Status Handling

- `APPLIED`: reconcile/drop
- `REJECTED`: rollback/drop
- `PENDING`: keep waiting and re-check

## Projection Freshness

Read model freshness is separate from command lifecycle:

```text
projection.updated SSE -> Redux listener -> GET snapshot -> reducer
```

SSE never drops outbox records and never acts as a command ACK.

Projection sync persists the latest event cursor locally. After restart or reconnect, the gateway should resume with the persisted cursor if it has no fresher in-memory event id.
