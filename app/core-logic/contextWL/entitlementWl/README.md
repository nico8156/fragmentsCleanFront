# Entitlement Context (WL)

Assure le suivi des droits utilisateur et du snapshot Pass publie par le backend.

- `typeAction/entitlement.type.ts` definit les droits possibles (`LIKE`, `COMMENT`, `SUBMIT_CAFE`), la structure `UserEntitlements` et le contrat Pass (`currentLevel`, `counters`, `levels`).
- `entitlementWl.reducer.ts` stocke les entitlements par utilisateur et hydrate les reponses reseau via `entitlementsHydrated`.
- `entitlementsRetrieval` recupere le snapshot serveur via `gateways.entitlements`. Le backend expose `GET /api/users/me/entitlements`.
- `passViewModel.ts` calcule uniquement une projection visuelle testable: progression des anneaux, objectifs restants et libelles.
- `projectionSyncWl` declenche `entitlementsRetrieval` quand il recoit `projection.updated` avec `projection="entitlements"`, `scope="user"` et `entityId=userId`.
- Les entitlements changent uniquement via snapshot serveur.

Flux cible:

```text
Validated user activity
-> backend updates ticket/social projections
-> backend evaluates pass policy
-> PassProgress contract
-> projection.updated/entitlements
-> entitlementsRetrieval(GET /api/users/me/entitlements)
-> entitlementsHydrated snapshot
-> PassViewModel
-> PassAvatar rings UI
```

Les seuils Pass ne doivent pas etre dupliques dans les composants React. Le mobile peut calculer une moyenne normalisee pour afficher un anneau, mais seulement a partir des `requirements` et `counters` fournis par le backend.

Le SSE ne drop jamais une commande outbox. `/commands/{commandId}` reste responsable du cycle de vie commande.
