# View Model Layer

Ces hooks React tiennent le rôle d'adaptateurs secondaires : ils transforment les états Redux (contextWL) en modèles prêts à afficher tout en orchestrant les use cases côté lecture/écriture.

## Principes clés

1. **Composition de sélecteurs** : chaque hook construit un selector mémoïsé (souvent via `useMemo`) pour éviter de recréer des fonctions à chaque render. Exemple : `useArticlesHome` dérive `selectArticlesForLocale(locale)` puis recompose les previews/sections en mémoire.【F:app/adapters/secondary/viewModel/useArticlesHome.ts†L1-L66】【F:app/adapters/secondary/viewModel/useArticlesHome.ts†L67-L113】
2. **Pilotage des use cases** : le hook déclenche les thunks lorsqu'un état passe à `IDLE` ou devient `stale`. Dans `useCommentsForCafe`, le `useEffect` appelle `commentRetrieval` (retrieve/refresh) suivant la fraîcheur `staleAfterMs`.【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L1-L74】【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L130-L172】
3. **Traduction métier → UI** : chaque view model enrichit les entités (ex : `relativeTime`, `transportStatus` calculé depuis l'outbox, fallback avatar).【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L74-L129】
4. **Interop contextuelle** : certains hooks combinent plusieurs contexts (coffees + openingHours + location) pour calculer des données composites (`useCafeOpenNow`, `useDistanceToPoint`).【F:app/adapters/secondary/viewModel/useDistanceToPoint.ts†L1-L40】

## Hooks principaux

| Hook | Rôle | Contexts utilisés |
| --- | --- | --- |
| `useArticlesHome` | Sliders + catégories pour l'écran Home | `articleWl` |
| `useCommentsForCafe` | Liste + actions sur les commentaires d'un café | `commentWl`, `outboxWl`, `userWl` |
| `useCafeFull` / `useCoffeesForMarkers` | Agrégats pour fiche et carte | `coffeeWl`, `openingHoursWl`, `likeWl` |
| `useLikesForCafe` | Comptage et statut utilisateur | `likeWl`, `userWl` |
| `useUserLocationFromStore` & `useDistanceToPoint` | Expose la géoloc et calcule les distances | `locationWl` |

Chaque hook renvoie un objet immuable (`as const`) contenant les données (VM) et les callbacks UI (`refresh`, `toggleLike`, `createComment`, etc.) pour préserver l'esprit event-driven.
