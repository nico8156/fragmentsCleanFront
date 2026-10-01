# Orchestrator - Mobile Read Feature

Use this when retrieving data for display.

## Responsibilities

- keep screens free of HTTP
- expose loading/error/empty/success through state
- map backend DTOs in gateways or use cases, not JSX
- keep selectors stable for view models

For articles, the gateway mapper owns transport-to-domain conversion. Screens,
reducers, and selectors do not parse backend JSON or provider payloads.

## Steps

Read [the iteration workflow](../../iteration-workflow.md) first. These are
boundary responsibilities, not a precomputed implementation sequence. For
`BEHAVIOUR`, express one observable example, inspect its RED and implement only
its minimum GREEN before the next example. Reuse existing contracts; introduce
new structures only when an example or invariant requires them. Continue on
`PASS`/`REVIEW`, escalate material ambiguity, then apply the targeted mutation
checkpoint to the green slice and pin missing protection. `REFACTORING` starts
green; `CHORE` uses proportionate checks.

1. Identify owning client context.
2. Define gateway port method.
3. Write thunk/listener test with fake gateway.
4. Dispatch requested action.
5. Call gateway.
6. Dispatch received or failed action.
7. Add selector/view model derivation.
8. Wire screen through view model only.

## Pitfalls

- fetch in component
- duplicated loading flags in UI local state
- backend DTO leaked into screen
- missing empty/error states
- race conditions from concurrent requests

## Validation

- success path updates reducer
- failure path exposes error
- screen consumes a view model
- tests use fake gateway, not real network
