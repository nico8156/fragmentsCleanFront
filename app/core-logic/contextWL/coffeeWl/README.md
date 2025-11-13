# Coffee Context (WL)

Pilote l'annuaire des cafés (coordonnées, adresse, métadonnées utiles à la carte et aux fiches détaillées).

- **Modèle** : `typeAction/coffeeWl.type.ts` définit les value objects (`CoffeeId`, `ISODate`) et l'entité `Coffee` enrichie (géoloc, tags, version).【F:app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type.ts†L1-L33】
- **Réducteur** : `coffeeWl.reducer.ts` gère l'hydratation par lot (`coffeesHydrated`), l'indexation par ville (`byCity`) et les flags de chargement/erreur sur une fiche spécifique.【F:app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer.ts†L1-L40】【F:app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer.ts†L41-L71】
- **Use cases** : `coffeeRetrieval.ts` expose `coffeeRetrieval`, `coffeeGlobalRetrieval` et `coffeesSearch` pour hydrater le cache local via `gateways.coffees`. Le thunk marque la fiche en `loading`, puis fusionne la réponse ou stocke l'erreur métier.【F:app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval.ts†L1-L34】【F:app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval.ts†L35-L55】
- **Sélecteurs** : `selector/coffeeWl.selector.ts` compose des view models riches (`selectCoffeeFullVM`, `selectViewForMarkers`) en agrégeant photos + horaires, directement consommés par `useCafeFull`, `useCafeOpenNow`, etc.【F:app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector.ts†L1-L72】【F:app/adapters/secondary/viewModel/useCafeFull.ts†L1-L18】

Consulte `coffeeFlow.mmd` pour le flux complet (intentions UI → thunk → gateway → reducer → view model).
