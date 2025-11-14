# Outbox Context (WL)

Fiabilise toutes les écritures réseau (likes, commentaires, tickets) via une queue idempotente.

- `type/outbox.type.ts` définit les commandes supportées (`Comment*`, `Like*`, `TicketVerify`), les payloads undo et le status machine (`queued` → `processing` → `awaitingAck`).【F:app/core-logic/contextWL/outboxWl/type/outbox.type.ts†L1-L39】【F:app/core-logic/contextWL/outboxWl/type/outbox.type.ts†L40-L64】
- `outboxWl.reducer.ts` réagit à `enqueueCommitted` (ajout ordonné + déduplication `byCommandId`), `markProcessing`, `markFailed`, `markAwaitingAck`, `dequeueCommitted` et `dropCommitted`.【F:app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer.ts†L1-L43】【F:app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer.ts†L44-L74】
- `processOutboxFactory` choisit le bon gateway en fonction de `command.kind`, exécute l'appel (`likes.add/remove`, `comments.create/update/delete`, `tickets.verify`), puis publie les actions de succès ou d'undo en cas d'échec. Les commandes restent en attente jusqu'à réception d'un ACK pour éviter les doublons.【F:app/core-logic/contextWL/outboxWl/processOutbox.ts†L1-L87】【F:app/core-logic/contextWL/outboxWl/processOutbox.ts†L87-L165】

## Runtime & reprise locale

- `selector/outboxSelectors.ts` expose des helpers stables (`selectOutboxState`, `selectNextOutboxRecord`, `selectOutboxRecordByCommandId`) pour supprimer les accès directs à `state.oState` dans les listeners/tests.【F:app/core-logic/contextWL/outboxWl/selector/outboxSelectors.ts†L1-L23】
- `runtime/syncRuntime.ts` orchestre `replayLocal()` + `decideAndSync()` (heuristique idle/session : `<=5 min → delta`, `5–30 min → delta avec fallback full`, `>30 min ou session changée → full`) et persiste `cursor`, `sessionId`, `lastActiveAt`, `appliedEventIds`.【F:app/core-logic/contextWL/outboxWl/runtime/syncRuntime.ts†L1-L134】
- `runtime/eventsApplier.ts` applique les ACK likes/comments/tickets de façon idempotente et tronque automatiquement l'historique des `appliedEventIds` (256 dernières entrées).【F:app/core-logic/contextWL/outboxWl/runtime/eventsApplier.ts†L1-L54】
- `runtime/syncMetaStorage.ts` fournit une implémentation mémoire + MMKV pour persister la méta sync, utilisée par Expo et les tests.【F:app/core-logic/contextWL/outboxWl/runtime/syncMetaStorage.ts†L1-L54】
- `adapters/secondary/gateways/fake/fakeEventsGateway.ts` simule des events serveur idempotents (likes/comments/tickets) pour la démo offline, branché dans `gateways.events`.【F:app/adapters/secondary/gateways/fake/fakeEventsGateway.ts†L1-L103】

Consulte `outboxFlow.mmd` pour visualiser la séquence "intent → enqueue → process → ack/rollback".
