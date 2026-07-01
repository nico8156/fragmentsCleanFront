# ACK and Command Status

Fragments uses two reconciliation paths.

Fast path:

```text
WebSocket ACK -> Redux ACK action -> reconcile/drop
```

Canonical fallback:

```text
outbox watchdog -> GET /commands/{commandId} -> APPLIED/REJECTED/PENDING
```

## Status Handling

- `APPLIED`: reconcile/drop
- `REJECTED`: rollback/drop
- `PENDING`: keep waiting and re-check

## Socket Rule

Socket ACK is useful but optional.

The mobile app must remain correct without receiving it.

