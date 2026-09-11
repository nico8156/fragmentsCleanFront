# Entitlement Context (WL)

Assure le suivi du snapshot Pass publié par le backend. Le champ `rights` reste
toléré dans le transport historique, mais les niveaux du Pass ne conditionnent
plus l'accès aux actions nécessaires à la progression.

- `typeAction/entitlement.type.ts` définit la structure de compatibilité `UserEntitlements` et le contrat Pass (`currentLevel`, `counters`, `levels`, `acquiredLevels`, `policyVersion`).
- `entitlementWl.reducer.ts` stocke les entitlements par utilisateur et hydrate les reponses reseau via `entitlementsHydrated`.
- `entitlementsRetrieval` recupere le snapshot serveur via `gateways.entitlements`. Le backend expose `GET /api/users/me/entitlements`.
- `passViewModel.ts` calcule uniquement une projection visuelle testable: progression des anneaux, objectifs restants et libelles.
- `projectionSyncWl` declenche `entitlementsRetrieval` quand il recoit `projection.updated` avec `projection="entitlements"`, `scope="user"` et `entityId=userId`.
- Les entitlements changent uniquement via snapshot serveur.

Flux cible:

```text
Ticket or experience integration event
-> backend Pass inbox and local contributions
-> backend evaluates Pass policy v2
-> PassProgress contract
-> projection.updated/entitlements
-> entitlementsRetrieval(GET /api/users/me/entitlements)
-> entitlementsHydrated snapshot
-> PassViewModel
-> PassAvatar rings UI
```

Les seuils Pass ne doivent pas être dupliqués dans les composants React. Le mobile
peut calculer une moyenne normalisée pour afficher un anneau, mais seulement à
partir des `requirements` et `counters` fournis par le backend. Les anciens calculs
locaux `exploration/goût/social` ont été supprimés.

Le SSE ne drop jamais une commande outbox. `/commands/{commandId}` reste responsable du cycle de vie commande.
