# Fragments Mobile Architecture

This directory documents the mobile-specific side of Fragments.

Primary doctrine:
- [Mobile AGENTS](../../AGENTS.md)
- [Backend/global doctrine](../../../fragmentsClean/AGENTS.md)

Read in order:

1. [Mobile runtime](runtime.md)
2. [Offline outbox](offline-outbox.md)
3. [Offline readiness](offline-readiness.md)
4. [ACK and command status](ack-and-command-status.md)
5. [Configuration and App Store](configuration-app-store.md)

## Redux Action Map

[Redux action map](redux-action-map.md) is the event-storming entry point for dispatches, listeners, and reducers.

When adding, renaming, or moving a Redux action, dispatch, listener, or reducer:

```bash
npm run redux:map
npm run redux:map:check
```

The check command must stay green before committing.
