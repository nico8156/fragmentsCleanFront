# Mobile Agent Guide - Fragments

Use this guide for all work in `/Users/nicolasmaldiney/fragmentsCleanFront`.

## Feature Classification

Before coding, classify the task:

1. Optimistic command: user write requiring offline support.
2. Read feature: data retrieval from backend or local projection.
3. Socket ACK: backend ACK event handling.
4. Bootstrap/runtime: app lifecycle, auth init, outbox rehydration, connectivity.
5. Screen feature: UI composition over an existing view model.
6. External/native adapter: SecureStore, MMKV, Location, ImagePicker, NetInfo, STOMP.
7. Architecture/doc feature: changes rules or documentation.

Use the matching orchestrator in `.agents/mobile/orchestrators`.

## Mandatory Rules

- Mobile owns UX, not backend truth.
- Backend remains source of truth.
- Critical writes use outbox.
- Network errors keep optimistic UI.
- Rollback only on explicit rejection.
- WebSocket ACK is optional fast path.
- `/commands/{commandId}` is mandatory fallback.
- Concrete gateways are wired centrally.
- Screens do not fetch.
- View models do not instantiate gateways.
- Tests are fake-first.
- Pass levels, thresholds, counters, and unlocked capabilities come from the backend entitlements snapshot; mobile only derives ring presentation from that snapshot.

## Definition of Done

Before completing a mobile task:
- the dependency direction is preserved
- the write/read flow has tests
- offline behavior is explicit
- command status fallback is considered for writes
- configuration/secrets are safe for EAS/App Store
- no UI global refactor was introduced unless requested
