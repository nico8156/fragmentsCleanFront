# Location Context (WL)

Centralise le suivi de la position GPS utilisateur (permissions, watch en temps réel, erreurs).

- `typeAction/location.type.ts` décrit l'état (`coords`, `status`, `permission`, `isWatching`) partagé par les features carte/recherche.【F:app/core-logic/contextWL/locationWl/typeAction/location.type.ts†L1-L12】
- `location.reducer.ts` réagit aux actions de permission, d'update GPS, de watch start/stop et d'erreur pour exposer un status cohérent (`idle`/`watching`/`paused`/`error`).【F:app/core-logic/contextWL/locationWl/reducer/location.reducer.ts†L1-L29】
- `userLocationListenerFactory` branche les gateways Expo Location : au bootstrap,
  il relit la permission et récupère une position seulement si elle est déjà
  accordée ; l'intention utilisateur peut solliciter une permission encore
  indéterminée. Il gère aussi la lecture ponctuelle et l'abonnement
  `watchPosition`, avec `watchError` en cas d'échec.
- La carte se centre sur la première position reçue après son montage. Le bouton
  de localisation peut afficher immédiatement une position connue, puis se
  recentre sur la nouvelle lecture GPS sans exiger un second appui.
- Les sélecteurs (`selectUserCoords`, `selectLocationStatus`…) alimentent les view models de distance (`useDistanceToPoint`, `useUserLocationFromStore`).【F:app/core-logic/contextWL/locationWl/selector/location.selector.ts†L1-L6】

`locationFlow.mmd` synthétise ce pipeline event-driven.
