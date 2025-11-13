# Ticket Context (WL)

Gère la capture et la vérification de tickets (scan OCR → commande `TicketVerify` → ACK serveur → entitlements).

- `typeAction/ticket.type.ts` formalise l'agrégat `TicketAggregate`, les statuts (`CAPTURED`, `ANALYZING`, `CONFIRMED`, `REJECTED`) et les helpers (`TicketSubmitHelpers`).【F:app/core-logic/contextWL/ticketWl/typeAction/ticket.type.ts†L1-L74】【F:app/core-logic/contextWL/ticketWl/typeAction/ticket.type.ts†L75-L115】
- `ticketWl.reducer.ts` couvre le cycle complet : création optimiste (`ticketOptimisticCreated`), merge serveur (`ticketRetrieved`), reconciliation `CONFIRMED/REJECTED`, rollback en cas d'erreur et suppression locale lors d'un `ticketRollBack`.【F:app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer.ts†L1-L73】【F:app/core-logic/contextWL/ticketWl/reducer/ticketWl.reducer.ts†L73-L117】
- `ticketSubmitUseCaseFactory` écoute `uiTicketSubmitRequested`, crée un ID temporaire, dispatch `ticketOptimisticCreated` puis enfile une commande `TicketVerify` dans l'outbox avant d'appeler `outboxProcessOnce`.【F:app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase.ts†L1-L49】【F:app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase.ts†L49-L70】
- `ackTicketsListenerFactory` traite `onTicketConfirmedAck`/`onTicketRejectedAck`, alimente le reducer et purge la commande avec `dropCommitted`, ce qui déclenche ensuite `ackEntitlementsListener`.【F:app/core-logic/contextWL/ticketWl/usecases/read/ackTicket.ts†L1-L38】

`ticketFlow.mmd` documente la chaîne complète.
