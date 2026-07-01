# Orchestrator - Mobile Socket ACK

Use this when handling a backend ACK delivered over WebSocket/STOMP.

## Responsibilities

- validate inbound event shape
- translate transport event into Redux action
- reconcile or rollback in reducers/listeners
- drop matching outbox command
- stay idempotent

## Steps

1. Identify backend ACK type and minimal mobile contract.
2. Add/update `ws.type` union.
3. Add route in WebSocket listener.
4. Write ACK listener test.
5. Implement reconcile/rollback action.
6. Drop committed outbox item by `commandId`.
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

