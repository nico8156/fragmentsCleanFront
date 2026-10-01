# Orchestrator - Mobile Optimistic Command

Use this for a user action that changes backend state and must work offline.

Examples:
- like/unlike
- create/update/delete comment
- submit ticket
- future wishlist/favorite writes

## Responsibilities

- express UI intent
- validate input
- generate `commandId`
- apply optimistic reducer
- enqueue local outbox command
- process when possible
- reconcile through socket ACK or command status polling

## Steps

Read [the iteration workflow](../../iteration-workflow.md) first. These are
boundary responsibilities, not a precomputed implementation sequence. For
`BEHAVIOUR`, express one observable example, inspect its RED and implement only
its minimum GREEN before the next example. Reuse existing contracts; introduce
new structures only when an example or invariant requires them. Continue on
`PASS`/`REVIEW`, escalate material ambiguity, then apply the targeted mutation
checkpoint to the green slice and pin missing protection. `REFACTORING` starts
green; `CHORE` uses proportionate checks.

1. Define UI action.
2. Write listener/use case test first.
3. Add optimistic reducer transition.
4. Add undo payload.
5. Generate stable `commandId`.
6. Enqueue outbox record.
7. Trigger `outboxProcessOnce`.
8. Add gateway port method if missing.
9. Handle ACK/reconcile/drop.
10. Handle `REJECTED` rollback.
11. Add no-socket command-status fallback test for critical flows.

## Pitfalls

- direct HTTP call from a screen
- rollback on network error
- no command idempotence
- outbox record not persisted
- assuming socket ACK always arrives
- treating `PENDING` as failure

## Validation

- optimistic state is visible immediately
- network failure schedules retry without rollback
- HTTP accepted moves record to `awaitingAck`
- socket ACK drops the record
- `/commands/{commandId}` `APPLIED` drops the record without socket
- `/commands/{commandId}` `REJECTED` rolls back and drops
