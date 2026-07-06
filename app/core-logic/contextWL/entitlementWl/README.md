# Entitlement Context (WL)

Assure le suivi des droits utilisateur en fonction du nombre de tickets confirmes.

- `typeAction/entitlement.type.ts` definit les droits possibles (`LIKE`, `COMMENT`, `SUBMIT_CAFE`), la structure `UserEntitlements` et les seuils configurables.
- `entitlementWl.reducer.ts` stocke les entitlements par utilisateur, recalcule dynamiquement les droits lorsqu'on change les seuils et hydrate les reponses reseau via `entitlementsHydrated`.
- `entitlementsRetrieval` recupere le snapshot serveur via `gateways.entitlements`. Le backend expose `GET /api/users/me/entitlements`.
- `projectionSyncWl` declenche `entitlementsRetrieval` quand il recoit `projection.updated` avec `projection="entitlements"`, `scope="user"` et `entityId=userId`.
- `ackEntitlementsListener` reste temporairement cable pour compatibilite avec les ACK tickets STOMP, mais il n'est plus le chemin cible de fraicheur des entitlements.

Flux cible:

```text
ticket_status_projection updated
-> user_entitlements_projection updated
-> projection.updated/entitlements
-> entitlementsRetrieval(GET /api/users/me/entitlements)
-> entitlementsHydrated snapshot
```

Le SSE ne drop jamais une commande outbox. `/commands/{commandId}` reste responsable du cycle de vie commande.
