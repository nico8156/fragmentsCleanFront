# Fragments Clean Front

Client mobile Expo structuré en **bounded contexts** Redux (dossier `app/core-logic/contextWL`) et adaptateurs primaires/secondaires. L'objectif : conserver une clean architecture (domain centré) tout en profitant d'Expo Router/React Navigation pour la présentation.

## Architecture hexagonale

| Couche | Rôle | Référence |
| --- | --- | --- |
| **Domain/Contexts** | États normalisés + use cases par domaine (`appWl`, `coffeeWl`, `ticketWl`…). Chaque contexte expose ses propres actions, réducteurs, gateways et documentation dédiée. | [`app/core-logic/contextWL`](./app/core-logic/contextWL) |
| **Store** | Assemblage Redux Toolkit + middlewares (`initReduxStoreWl`, listeners outbox, auth/location). | [`app/store`](./app/store) |
| **View models (adapteurs secondaires)** | Hooks `use*` qui combinent selectors, déclenchent les thunks et produisent des VM immuables. | [`app/adapters/secondary/viewModel`](./app/adapters/secondary/viewModel/README.md) |
| **React (adaptateur primaire)** | Navigation, écrans, composants Expo/React Native. | [`app/adapters/primary/react`](./app/adapters/primary/react/README.md) |

L'application démarre dans `_layout.tsx` : création du store, injection des listeners (likes/comments/outbox/auth/location), puis montage de `RootNavigator` + `AppInitializer`. Chaque listener déclenche des actions Redux qui alimentent les contexts, les selectors et enfin les view models React.【F:app/_layout.tsx†L1-L71】【F:app/_layout.tsx†L71-L105】

## Pipeline event-driven (Redux puriste)

1. **Intention UI** : un écran appelle une action "UI" (`uiTicketSubmitRequested`, `authSignInRequested`, `commentRetrieval`).
2. **Use case / listener** : middleware `createListenerMiddleware` orchestre les appels réseau, gère les permissions (location) ou la persistence (auth secure store).【F:app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase.ts†L1-L49】【F:app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory.ts†L1-L74】
3. **Outbox / Side effects** : les écritures passent par `processOutboxFactory` pour garantir l'idempotence et gérer les ACKs (likes, comments, tickets).【F:app/core-logic/contextWL/outboxWl/processOutbox.ts†L1-L87】
4. **Reducers** : chaque contexte maintient son state normalisé (`articleWl`, `coffeeWl`, `userWl`…), parfois avec EntityAdapter, caches par locale, indexes géographiques…【F:app/core-logic/contextWL/articleWl/reducer/articleWl.reducer.ts†L1-L82】【F:app/core-logic/contextWL/coffeeWl/reducer/coffeeWl.reducer.ts†L1-L40】
5. **Selectors/View models** : les hooks du dossier `viewModel` combinent plusieurs contexts et retournent des objets prêts à afficher (`useCommentsForCafe`, `useArticlesHome`, `useCafeFull`).【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L1-L74】【F:app/adapters/secondary/viewModel/useArticlesHome.ts†L1-L66】
6. **React UI** : les écrans (`features/home`, `features/map`, etc.) consomment ces hooks et dispatchent les actions UI en retour.【F:app/adapters/primary/react/features/home/screens/HomeScreen.tsx†L1-L71】【F:app/adapters/primary/react/features/map/screens/MapScreen.tsx†L1-L40】

Cette boucle assure une propagation unidirectionnelle (intent → middleware → reducer → selectors → UI) fidèle à Redux puriste.

## Cartographie des contexts (bounded contexts)

Chaque dossier dispose maintenant d'un README + d'un diagramme `.mmd` détaillant son flux :

- [`appWl`](./app/core-logic/contextWL/appWl/README.md)
- [`articleWl`](./app/core-logic/contextWL/articleWl/README.md)
- [`coffeeWl`](./app/core-logic/contextWL/coffeeWl/README.md)
- [`cfPhotosWl`](./app/core-logic/contextWL/cfPhotosWl/README.md)
- [`commentWl`](./app/core-logic/contextWL/commentWl/README.md)
- [`entitlementWl`](./app/core-logic/contextWL/entitlementWl/README.md)
- [`likeWl`](./app/core-logic/contextWL/likeWl/README.md)
- [`locationWl`](./app/core-logic/contextWL/locationWl/README.md)
- [`openingHoursWl`](./app/core-logic/contextWL/openingHoursWl/README.md)
- [`outboxWl`](./app/core-logic/contextWL/outboxWl/README.md)
- [`ticketWl`](./app/core-logic/contextWL/ticketWl/README.md)
- [`userWl`](./app/core-logic/contextWL/userWl/README.md)

Ces documents expliquent le modèle, les reducers, les use cases et la façon dont les events circulent (ex : `ticketFlow.mmd`, `locationFlow.mmd`).

## View models & React

- [View models](./app/adapters/secondary/viewModel/README.md) : conventions d'écriture des hooks `use*`, réutilisation des selectors et déclenchement automatique des thunks selon l'état (`IDLE`/`stale`).
- [Adaptateur React](./app/adapters/primary/react/README.md) : navigation, initialisation (`AppInitializer`) et principes d'orchestration des features.

## Démarrer le projet

```bash
npm install
npm run start
```

Tests & lint :

```bash
npm test
npm run lint
```
