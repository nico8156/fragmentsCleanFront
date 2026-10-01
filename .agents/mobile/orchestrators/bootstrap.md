# Orchestrator - Mobile Bootstrap

Use this when changing app startup, auth initialization, runtime adapters, connectivity, or outbox rehydration.

## Responsibilities

- mount runtime adapters
- initialize auth before command processing
- rehydrate outbox before retry
- start warmup reads safely
- cleanup on unmount

## Steps

Read [the iteration workflow](../../iteration-workflow.md) first. These are
boundary responsibilities, not a precomputed implementation sequence. For
`BEHAVIOUR`, express one observable example, inspect its RED and implement only
its minimum GREEN before the next example. Reuse existing contracts; introduce
new structures only when an example or invariant requires them. Continue on
`PASS`/`REVIEW`, escalate material ambiguity, then apply the targeted mutation
checkpoint to the green slice and pin missing protection. `REFACTORING` starts
green; `CHORE` uses proportionate checks.

1. Mount NetInfo/AppState adapters.
2. Dispatch hydration done.
3. Initialize auth session.
4. Rehydrate outbox from storage.
5. If signed in and online, trigger outbox processing.
6. Run non-critical warmup reads.
7. Dispatch warmup/boot success.
8. On error, dispatch boot failed.
9. On unmount, cleanup adapters.

## Pitfalls

- processing outbox before auth token exists
- warmup read blocking outbox recovery
- missing cleanup
- duplicate runtime listeners
- hidden gateway construction in bootstrap

## Validation

- auth initializes before outbox process
- outbox rehydrates before processing
- offline boot keeps queue intact
- online signed-in boot processes queue
- cleanup is tested when adapters are mounted
