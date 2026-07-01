# Orchestrator - Mobile Read Feature

Use this when retrieving data for display.

## Responsibilities

- keep screens free of HTTP
- expose loading/error/empty/success through state
- map backend DTOs in gateways or use cases, not JSX
- keep selectors stable for view models

## Steps

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

