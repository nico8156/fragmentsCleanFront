# Mobile Runtime

The runtime coordinates app lifecycle, connectivity, authentication, outbox recovery, and WebSocket connection.

## Boot Order

```text
AppBootstrap
-> mount NetInfo/AppState adapters
-> appHydrationDone
-> initializeAuth
-> rehydrateOutbox
-> outboxProcessOnce if signed in and online
-> warmup reads
-> appWarmupDone / appBootSucceeded
```

## Rules

- Auth must initialize before outbox processing.
- Outbox must rehydrate before retry.
- Warmup reads must not block command recovery.
- Runtime adapters must be cleaned up on unmount.
- Connectivity events resume/suspend outbox.

