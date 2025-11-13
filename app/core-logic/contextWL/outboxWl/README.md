# Outbox Context (WL)

Fiabilise toutes les écritures réseau (likes, commentaires, tickets) via une queue idempotente.

- `type/outbox.type.ts` définit les commandes supportées (`Comment*`, `Like*`, `TicketVerify`), les payloads undo et le status machine (`queued` → `processing` → `awaitingAck`).【F:app/core-logic/contextWL/outboxWl/type/outbox.type.ts†L1-L39】【F:app/core-logic/contextWL/outboxWl/type/outbox.type.ts†L40-L64】
- `outboxWl.reducer.ts` réagit à `enqueueCommitted` (ajout ordonné + déduplication `byCommandId`), `markProcessing`, `markFailed`, `markAwaitingAck`, `dequeueCommitted` et `dropCommitted`.【F:app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer.ts†L1-L43】【F:app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer.ts†L44-L74】
- `processOutboxFactory` choisit le bon gateway en fonction de `command.kind`, exécute l'appel (`likes.add/remove`, `comments.create/update/delete`, `tickets.verify`), puis publie les actions de succès ou d'undo en cas d'échec. Les commandes restent en attente jusqu'à réception d'un ACK pour éviter les doublons.【F:app/core-logic/contextWL/outboxWl/processOutbox.ts†L1-L87】【F:app/core-logic/contextWL/outboxWl/processOutbox.ts†L87-L165】

Consulte `outboxFlow.mmd` pour visualiser la séquence "intent → enqueue → process → ack/rollback".
