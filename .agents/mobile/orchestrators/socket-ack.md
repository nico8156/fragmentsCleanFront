# Orchestrator - Mobile Socket ACK

Use this when handling a backend ACK delivered over WebSocket/STOMP.

## Responsibilities

- validate inbound event shape
- translate transport event into Redux action
- reconcile or rollback in reducers/listeners
- drop matching outbox command
- stay idempotent

## Steps

Read [the iteration workflow](../../iteration-workflow.md) first. These are
boundary responsibilities, not a precomputed implementation sequence. For
`BEHAVIOUR`, express one observable example, inspect its RED and implement only
its minimum GREEN before the next example. Reuse existing contracts; introduce
new structures only when an example or invariant requires them. Continue on
`PASS`/`REVIEW`, escalate material ambiguity, then apply the targeted mutation
checkpoint to the green slice and pin missing protection. `REFACTORING` starts
green; `CHORE` uses proportionate checks.

1. Identify backend ACK type and minimal mobile contract.
2. Write and inspect one ACK listener RED for the first observable outcome.
3. Add/update the minimal `ws.type` and listener route needed for GREEN.
4. Drive reconcile/rollback through successive examples.
5. Drive removal of the matching outbox item through an example.
6. Verify other commands remain untouched and duplicate ACK is harmless.
7. Add stale/unknown event behavior if versioned state can regress.

## Pitfalls

- gateway mutating state directly
- ACK without `commandId`
- assuming socket delivery is reliable
- no polling fallback
- applying stale server version over newer local/server state

## Validation

- ACK applied reconciles and drops
- ACK rejected rolls back and drops
- duplicate ACK is harmless
- unknown ACK is ignored/logged
