# Mobile Runtime

The runtime coordinates app lifecycle, connectivity, authentication, outbox recovery, and projection sync.

## Boot Order

```text
AppBootstrap
-> mount NetInfo/AppState adapters
-> appHydrationDone
-> initializeAuth
-> locationBootstrapRequested
-> rehydrateOutbox
-> rehydrateReadModelCache
-> outboxProcessOnce if signed in and online
-> warmup reads
-> appWarmupDone / appBootSucceeded
```

## Rules

- Auth must initialize before outbox processing.
- Startup checks the existing foreground-location authorization. If it is
  already granted, one current position is requested; startup never opens the
  permission prompt. An explicit user action remains required to ask for an
  undetermined authorization.
- Account isolation resets location state along with the private snapshot. A
  sign-in/sign-out after boot therefore triggers the same non-prompting location
  bootstrap; the initial auth transition does not duplicate the boot request.
- Outbox must rehydrate before retry.
- Durable read models must rehydrate before non-critical warmup reads.
- Warmup reads must not block command recovery.
- Runtime adapters must be cleaned up on unmount.
- Connectivity events resume/suspend outbox.
- Projection sync reconnects only when the app is active, online, and authenticated.
- Connectivity returning online dispatches auth refresh, user hydration, outbox resume/process/watchdog, and projection sync.
- Transient auth refresh failures must not clear `SecureStore`.
