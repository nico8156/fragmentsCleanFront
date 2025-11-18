
---

# Fragments Clean Front

Client mobile Expo structuré en **bounded contexts** Redux (dossier `app/core-logic/contextWL`) et adaptateurs primaires/secondaires.
L’objectif : conserver une architecture propre, centrée domaine, tout en profitant d’Expo Router / React Navigation pour la présentation.

---

## 🧱 Architecture hexagonale

| Couche                                    | Rôle                                                                                                                                     | Référence                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Domain / Contexts (write-logic)**       | State normalisé + use cases + actions pour chaque domaine (`coffeeWl`, `ticketWl`, `likeWl`…), plus l’orchestration runtime via `appWl`. | [`app/core-logic/contextWL`](./app/core-logic/contextWL)                           |
| **Store (composition)**                   | Redux Toolkit + middlewares + listeners : outbox runtime, sync events, auth, location.                                                   | [`app/store`](./app/store)                                                         |
| **View Models (adaptateurs secondaires)** | Hooks `use*` combinant selectors + use cases pour produire des objets immuables prêts à afficher.                                        | [`app/adapters/secondary/viewModel`](./app/adapters/secondary/viewModel/README.md) |
| **React (adaptateur primaire)**           | Navigation, écrans, composants Expo. Relie UI → intentions → Redux → ViewModels → UI.                                                    | [`app/adapters/primary/react`](./app/adapters/primary/react/README.md)             |

L’application est initialisée dans `_layout.tsx` : création du store, montage des listeners runtime (outbox, sync events, auth, location) puis rendu des navigateurs Expo Router.

---

## 🔄 Pipeline event-driven (Redux puriste)

1. **Intention UI**
   Une action UI est dispatchée depuis un écran (ex : `ticketVerifyRequested`, `likeSetRequested`, `authSignInRequested`).
2. **Use case / listener**
   Les middlewares (`createListenerMiddleware`) orchestent :
   appels réseau, permissions (location), préparations outbox, résolutions tempId→serverId.
3. **Outbox / Side-effects offline-first**
   Toutes les écritures passent par une **file persistée** :

    * `enqueue(command)`
    * `outboxProcessOnce()`
    * backoff + retry
    * idempotence via `commandId`
    * squash (ex : Like.Set)
4. **Reducers**
   Mise à jour normalisée dans les BC (`coffeeWl`, `commentWl`, `ticketWl`, etc.).
5. **Selectors / View models**
   Les hooks `use*` agrègent plusieurs contexts (ex : `useCafeFull`, `useCommentsForCafe`).
6. **React UI**
   Les écrans consomment les VMs et redispatchent des intentions.

Architecture unidirectionnelle :
**UI → listener/use case → reducer → selectors → UI.**

---

## 📡 Runtime de reprise & synchronisation offline-first

Deux signaux RN alimentent `appWl` :

* **`AppState`** (via `appState.adapter`)
  → `appBecameActive`
* **`NetInfo`** (via `netInfo.adapter`)
  → `appConnectivityChanged({ online })`

`appWl` ne gère plus le boot initial :
**il ne s’occupe que de la reprise runtime.**

### Foreground (app redevient active)

```
appBecameActive
    → outboxProcessOnce
    → replayRequested
    → syncDecideRequested
```

### Reconnexion (offline → online)

```
appConnectivityChanged(online: true)
    → outboxProcessOnce
    → syncDecideRequested
```

### Composants runtime

* **`syncRuntime.ts`** : heuristique syncDelta/syncFull (cursor, session, idle).
* **`syncEventsListenerFactory.ts`** : applique les événements serveur dans les BC (idempotence, appliquer seulement les nouveaux eventIds).
* **`outboxProcessOnce`** : exécute une commande persistée, applique la résolution optimiste, puis publie l’ACK serveur.

---

## 🗂 Cartographie complète des bounded contexts

Chaque contexte expose un `README` avec :

* son modèle
* ses reducers
* ses use cases
* ses gateways
* son diagramme `.mmd`

Contexts :

* [`appWl`](./app/core-logic/contextWL/appWl/README.md)
* [`articleWl`](./app/core-logic/contextWL/articleWl/README.md)
* [`coffeeWl`](./app/core-logic/contextWL/coffeeWl/README.md)
* [`cfPhotosWl`](./app/core-logic/contextWL/cfPhotosWl/README.md)
* [`commentWl`](./app/core-logic/contextWL/commentWl/README.md)
* [`entitlementWl`](./app/core-logic/contextWL/entitlementWl/README.md)
* [`likeWl`](./app/core-logic/contextWL/likeWl/README.md)
* [`locationWl`](./app/core-logic/contextWL/locationWl/README.md)
* [`openingHoursWl`](./app/core-logic/contextWL/openingHoursWl/README.md)
* [`outboxWl`](./app/core-logic/contextWL/outboxWl/README.md)
* [`ticketWl`](./app/core-logic/contextWL/ticketWl/README.md)
* [`userWl`](./app/core-logic/contextWL/userWl/README.md)

---

## 🎛 View models & React

Voir :

* [View models](./app/adapters/secondary/viewModel/README.md) — conventions, immutabilité, règles de fetch selon état `IDLE/stale`.
* [Adaptateur React](./app/adapters/primary/react/README.md) — navigation, initialisation, side-effects UI.

---

## ▶ Démarrer

```bash
npm install
npm run start
```

Tests & lint :

```bash
npm test
npm run lint
```

---
