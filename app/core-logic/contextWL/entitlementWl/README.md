# Entitlement Context (WL)

Assure le suivi des droits utilisateur (like/commentaire/soumission) en fonction du nombre de tickets confirmés.

- `typeAction/entitlement.type.ts` définit les droits possibles (`LIKE`, `COMMENT`, `SUBMIT_CAFE`), la structure `UserEntitlements` et les seuils configurables.【F:app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type.ts†L1-L24】
- `entitlementWl.reducer.ts` stocke les entitlements par utilisateur, recalcule dynamiquement les droits lorsqu'on change les seuils et hydrate les réponses réseau via `entitlementsHydrated`.【F:app/core-logic/contextWL/entitlementWl/reducer/entitlementWl.reducer.ts†L1-L35】【F:app/core-logic/contextWL/entitlementWl/reducer/entitlementWl.reducer.ts†L36-L55】
- `entitlementsRetrieval` récupère les droits depuis `gateways.entitlements` et fournit un fallback à 0 lorsqu'aucun backend n'est injecté.【F:app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval.ts†L1-L30】
- `ackEntitlementsListener` écoute `onTicketConfirmedAck` pour incrémenter `confirmedTickets` dès qu'un ticket est validé côté serveur, garantissant une propagation event-driven vers le reducer.【F:app/core-logic/contextWL/entitlementWl/usecases/read/ackEntitlement.ts†L1-L24】

`entitlementFlow.mmd` détaille l'orchestration (retrieval, ack, recalcul des droits).
