# Location Context (WL)

Centralise le suivi de la position GPS utilisateur (permissions, watch en temps réel, erreurs).

- `typeAction/location.type.ts` décrit l'état (`coords`, `status`, `permission`, `isWatching`) partagé par les features carte/recherche.【F:app/core-logic/contextWL/locationWl/typeAction/location.type.ts†L1-L12】
- `location.reducer.ts` réagit aux actions de permission, d'update GPS, de watch start/stop et d'erreur pour exposer un status cohérent (`idle`/`watching`/`paused`/`error`).【F:app/core-logic/contextWL/locationWl/reducer/location.reducer.ts†L1-L29】
- `userLocationListenerFactory` branche les gateways Expo Location : vérifie/sollicite les permissions, récupère une position ponctuelle (`getOnceRequested`) et gère un abonnement `watchPosition`, tout en dispatchant `watchError` en cas d'échec.【F:app/core-logic/contextWL/locationWl/usecases/userLocationFactory.ts†L1-L61】【F:app/core-logic/contextWL/locationWl/usecases/userLocationFactory.ts†L61-L92】
- Les sélecteurs (`selectUserCoords`, `selectLocationStatus`…) alimentent les view models de distance (`useDistanceToPoint`, `useUserLocationFromStore`).【F:app/core-logic/contextWL/locationWl/selector/location.selector.ts†L1-L6】

`locationFlow.mmd` synthétise ce pipeline event-driven.
