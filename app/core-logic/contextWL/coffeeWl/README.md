# Coffee Context (WL)

Pilote l'annuaire des cafés (coordonnées, adresse, métadonnées utiles à la carte et aux fiches détaillées).

- **Modèle** : `typeAction/coffeeWl.type.ts` définit les value objects (`CoffeeId`, `ISODate`) et l'entité `Coffee` enrichie (géoloc, tags, version).【F:app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type.ts†L1-L33】
- **Réducteur** : `coffeeWl.reducer.ts` sépare strictement les projections café (`byId`, `ids`, `byCity`) de l'état technique des requêtes (`requests`). Une panne réseau ne fabrique donc jamais une entité café partielle. Une réponse de détail dont la version est antérieure à celle du cache est ignorée.
- **Use cases** : `coffeeRetrieval.ts` expose `coffeeRetrieval`, `coffeeGlobalRetrieval` et `coffeesSearch` pour hydrater le cache local via `gateways.coffees`. Les états `loading`, `success` et `error` restent dans `requests`; le catalogue est remplacé par le snapshot public du backend.
- **Contrats transport** : les projections photos et horaires passent par des mappers stricts. Un champ absent ou mal typé rejette la réponse au lieu de produire silencieusement des valeurs comme `"undefined"`.
- **Sélecteurs** : `selector/coffeeWl.selector.ts` compose des view models riches (`selectCoffeeFullVM`, `selectViewForMarkers`) en agrégeant photos + horaires, directement consommés par `useCafeFull`, `useCafeOpenNow`, etc.【F:app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector.ts†L1-L72】【F:app/adapters/secondary/viewModel/useCafeFull.ts†L1-L18】

Consulte `coffeeFlow.mmd` pour le flux complet (intentions UI → thunk → gateway → reducer → view model).
