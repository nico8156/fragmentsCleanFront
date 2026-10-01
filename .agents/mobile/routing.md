# Mobile Agent Routing - Fragments

Before implementing, classify the mobile task.

Read [the iteration workflow](../iteration-workflow.md) first. Apply its
emergent TDD and targeted mutation checkpoint to behavior changes. Treat the
orchestrators as responsibilities to cover one example at a time, not as a
predetermined implementation plan.

## Optimistic Command

Use `orchestrators/optimistic-command.md` for offline-first writes.

Examples:
- like/unlike
- comment create/update/delete
- ticket submission

## Read Feature

Use `orchestrators/read-feature.md` for data retrieval and display state.

Examples:
- coffee detail
- comments list
- article detail
- ticket history

## Socket ACK

Use `orchestrators/socket-ack.md` for backend ACK messages.

Examples:
- like ACK
- comment ACK
- ticket verification completed ACK

## Bootstrap

Use `orchestrators/bootstrap.md` for app startup, auth, connectivity, outbox rehydration, and runtime lifecycle.

## If Unsure

Do not add UI or network calls first.

Identify:
- screen/view model involved
- client context owner
- gateway port needed
- whether write must use outbox
- whether command status fallback is required
