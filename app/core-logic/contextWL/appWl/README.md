
---

> **Le point d’entrée conceptuel de l’architecture *runtime* de l’app pour les reprises.**
> Ce document répond à :
> *“Que se passe-t-il quand l’app redevient active ou retrouve le réseau ?”*

---

# 🌎 `appWl` — Application Lifecycle Orchestration (Reprise & Réseau)

`appWl` est le **bounded context qui orchestre la reprise du runtime de l’application**.

Il ne contient **aucune règle métier** et **ne gère plus le boot initial** (hydratation, premiers fetch, etc.).
Son rôle est désormais ciblé :

* **Relancer l’Outbox** lorsque :

  * l’app repasse en **foreground** (`appBecameActive`)
  * la connectivité réseau redevient **online** (`appConnectivityChanged({ online: true })`)
* **Ré-enclencher la mécanique SYNC** (replay + decide) à ces moments clés.

`appWl` fonctionne comme un **superviseur léger** qui active l’Outbox/SYNC au bon moment, en réponse aux signaux de l’environnement.

> Les signaux bruts (`AppState`, `NetInfo`) sont capturés par des **adaptateurs runtime** :
>
> * `mountAppStateAdapter` → dispatch `appBecameActive`
> * `connectivityAdapter` (NetInfo) → dispatch `appConnectivityChanged({ online })`
>
> `appWl` ne parle jamais directement à React Native.

---

# 🧩 Architecture d’ensemble

```txt
+---------------------+           +-------------------------+
|     appWl           | ------->  |   outboxWl (runtime)    |
| (orchestrateur)     |           | (processing + sync)     |
+---------------------+           +-------------------------+

+---------------------+           +-------------------------+
|  coffeeWl / ...     | <-------  |   syncEventsListener    |
|   (read models)     |           | (events → BC reducers)  |
+---------------------+           +-------------------------+
```

* `appWl` ne connaît que des **actions Redux** (`outboxProcessOnce`, `replayRequested`, `syncDecideRequested`, …).
* `outboxWl` se charge de l’exécution réelle (process de la queue, sync, replay).
* Les autres BC (ex : `coffeeWl`) consomment les événements produits par la SYNC via un `syncEventsListener` dédié.

---

# 🔄 Foreground Resumption — `appBecameActive`

Quand l’app sort du background (signalé par `AppState` via `mountAppStateAdapter`) :

```txt
appBecameActive()
   → outboxProcessOnce()
   → replayRequested()
   → syncDecideRequested()
```

On peut voir ça comme un **mini-boot** focalisé sur :

* vider/traiter la file Outbox au moins une fois
* rejouer les événements en attente (replay)
* décider s’il faut lancer une SYNC complémentaire (delta/full)

C’est ce qui garantit que l’utilisateur, en revenant sur l’app, retrouve un état **cohérent et à jour autant que possible**.

---

# 📶 Reconnexion réseau — `appConnectivityChanged({ online: true })`

Dès que la connectivité passe d’**offline → online** (via l’adaptateur NetInfo) :

```txt
appConnectivityChanged({ online: true })
   → outboxProcessOnce()
   → syncDecideRequested()
```

Le système essaie aussitôt :

* d’envoyer les **commandes en attente** dans l’Outbox
* de **synchroniser l’état serveur** (via la logique de SYNC : `syncDecideRequested`)

---

# 🧠 Rôle exact de `runtimeListenerFactory`

```ts
// appWl/runtimeListenerFactory.ts
import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import {
    appBecameActive,
    appConnectivityChanged,
} from "../typeAction/appWl.action";
import {
    outboxProcessOnce,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";
import {
    replayRequested,
    syncDecideRequested,
} from "@/app/core-logic/contextWL/outboxWl/typeAction/sync.action";

export const runtimeListenerFactory = () => {
    const runtimeListener = createListenerMiddleware<RootStateWl, AppDispatchWl>();
    const listener = runtimeListener.startListening as TypedStartListening<
        RootStateWl,
        AppDispatchWl
    >;

    listener({
        actionCreator: appBecameActive,
        effect: async (_, api) => {
            console.log("[APP RUNTIME] appBecameActive: resume outbox + sync");
            api.dispatch(outboxProcessOnce());
            api.dispatch(replayRequested());
            api.dispatch(syncDecideRequested());
        },
    });

    listener({
        actionCreator: appConnectivityChanged,
        effect: async (action, api) => {
            if (action.payload.online) {
                console.log("[APP RUNTIME] appConnectivityChanged: online, resume outbox + sync");
                api.dispatch(outboxProcessOnce());
                api.dispatch(syncDecideRequested());
            }
        },
    });

    return runtimeListener.middleware;
};
```

Le listener de `appWl` est uniquement un **dispatcher ordonné** :

| Trigger                          | Actions déclenchées                 |
| -------------------------------- | ----------------------------------- |
| `appBecameActive`                | `outboxProcessOnce` + replay + sync |
| `appConnectivityChanged(online)` | `outboxProcessOnce` + sync          |

Il ne contient :

* aucun accès direct au réseau
* aucune règle métier
* aucun accès aux gateways métier

Il se contente de **coordonner les bounded contexts existants** en fonction de l’état runtime de l’app.

---

# 🧪 Tests (philosophie)

Les tests de `runtimeListener` vérifient essentiellement :

### ✔ `appBecameActive`

* que `outboxProcessOnce` est dispatché
* que `replayRequested` est dispatché
* que `syncDecideRequested` est dispatché
* **et rien d’autre**

### ✔ `appConnectivityChanged({ online: true })`

* que `outboxProcessOnce` est dispatché
* que `syncDecideRequested` est dispatché

> On reste aligné avec la philosophie :
> **on vérifie les actions dispatchées, pas les gateways.**

---

# 📦 Résumé : la responsabilité exacte de `appWl` (version actuelle)

`appWl` garantit que, à chaque **reprise foreground** ou **reconnexion réseau** :

* l’Outbox est **relancée** au moins une fois
* la mécanique SYNC peut **décider** et **tourner en fond**
* les autres BC peuvent retrouver un état cohérent via les événements de sync

Il ne s’occupe plus :

* du **boot initial** (hydratation, premiers fetch, etc.)
* de la configuration des gateways
* des règles métier

C’est un **chef d’orchestre runtime minimaliste** qui réagit uniquement :

* quand l’app redevient **active**
* quand le réseau redevient **online**

---
