# Ticket Context (WL)

Gère la capture et la vérification de tickets (scan OCR → commande `TicketVerify` → projection status → snapshot mobile).

- `typeAction/ticket.type.ts` formalise l'agrégat `TicketAggregate`, les statuts (`CAPTURED`, `ANALYZING`, `CONFIRMED`, `REJECTED`) et les helpers (`TicketSubmitHelpers`).【F:app/core-logic/contextWL/ticketWl/typeAction/ticket.type.ts†L1-L74】【F:app/core-logic/contextWL/ticketWl/typeAction/ticket.type.ts†L75-L115】
- `ticketWl.reducer.ts` couvre le cycle complet : création optimiste (`ticketOptimisticCreated`), merge serveur (`ticketRetrieved`), reconciliation `CONFIRMED/REJECTED`, rollback en cas d'erreur et suppression locale lors d'un `ticketRollBack`.【F:app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer.ts†L1-L73】【F:app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer.ts†L73-L117】
- `ticketSubmitUseCaseFactory` écoute `uiTicketSubmitRequested`, crée un ID temporaire, dispatch `ticketOptimisticCreated` puis enfile une commande `TicketVerify` dans l'outbox avant d'appeler `outboxProcessOnce`.【F:app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase.ts†L1-L49】【F:app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase.ts†L49-L70】
- `ticketRetrieval` lit le read model serveur via `TicketsWlGateway.getStatus`, hydrate `ticketRetrieved` et conserve la séparation entre fraîcheur projection et cycle de vie commande.
- `projectionSyncWl` déclenche `ticketRetrieval` quand il reçoit `projection.updated` avec `projection="tickets"`, `scope="entity"` et `entityId=ticketId`.
- `/commands/{commandId}` reste le seul mécanisme de cycle de vie commande.

Règle importante :

```text
projection.updated/tickets
-> ticketRetrieval(GET /api/tickets/{ticketId}/status)
-> ticketRetrieved snapshot
```

Le SSE ne déclenche jamais `dropCommitted(commandId)`. Le cycle commande reste porté par `/commands/{commandId}`.

`ticketFlow.mmd` documente la chaîne complète.
