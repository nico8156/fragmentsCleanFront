> **Le point d’entrée conceptuel de toute l’architecture runtime de l’app.**
> Ce document répond à : *“Que se passe-t-il quand l’app démarre, redevient active, ou retrouve le réseau ?”*

---

# # 🌎 `appWl` — Application Lifecycle Orchestration

`appWl` est le **bounded context qui orchestre le cycle de vie global de l’application**.
Il ne contient **aucune règle métier** : son rôle est de coordonner :

* la réhydratation locale (redux-persist, outbox)
* la récupération des données globales (coffees, photos, horaires…)
* la remise en route des systèmes (auth, localisation)
* les mécanismes Outbox (process, replay, sync)
* la réaction aux signaux de l’environnement :

    * `AppState` (active/background)
    * `NetInfo` (online/offline)

`appWl` fonctionne comme un **superviseur** qui active les autres bounded contexts.

---

# # 🧩 Architecture d’ensemble

```
+---------------------+           +-------------------------+
|     appWl           | ------->  |   outboxWl (runtime)    |
| (orchestrateur)     |           | (processing + sync)     |
+---------------------+           +-------------------------+

+---------------------+           +-------------------------+
|  coffeeWl / ...     | <-------  |   syncEventsListener    |
|   (read models)     |           | (events → BC reducers)  |
+---------------------+           +-------------------------+
```

---

# # 🚀 Boot Sequence (Warm Start)

Lorsque l’utilisateur lance l’app, `appBootRequested()` est dispatché automatiquement.

La séquence est **strictement ordonnée** :

```
appBootRequested
   ├── 1) Hydratation (redux-persist)
   ├── 2) Outbox: rehydrate + processOnce()
   ├── 3) Init Auth + Location + Global Fetch
   ├── 4) Entitlements si utilisateur connu
   ├── 5) SYNC: replay + decide
   ├── WarmupDone + BootSucceeded
```

### Séquence détaillée

```
appBootRequested()
   ↓
dispatch(appHydrationDone())
   ↓
rehydrateOutbox()
   ↓
if(snapshot.queue.notEmpty) → outboxProcessOnce()
   ↓
initializeAuth()
requestLocationPermission()
getOnceRequested()
coffeeGlobalRetrieval()
onCfPhotoRetrieval()
onOpeningHourRetrieval()
   ↓
if(authenticated) → entitlementsRetrieval()
   ↓
dispatch(replayRequested())
dispatch(syncDecideRequested())
   ↓
dispatch(appWarmupDone())
dispatch(appBootSucceeded())
```

---

# # 🔄 Foreground Resumption — `appBecameActive`

Quand l’app sort du background :

```
appBecameActive()
   → outboxProcessOnce()
   → replayRequested()
   → syncDecideRequested()
```

C’est **strictement l’équivalent** d’un “petit boot”.

---

# # 📶 Reconnexion réseau — `appConnectivityChanged({ online: true })`

Dès qu’on passe **offline → online** :

```
→ outboxProcessOnce()
→ syncDecideRequested()
```

Le système essaie aussitôt :

* d’envoyer les commandes en attente
* de synchroniser l’état serveur (delta ou full)

---

# # 🧠 Rôle exact de `runtimeListenerFactory`

Le listener de `appWl` est uniquement un **dispatcher ordonné** :

| Trigger                          | Actions                        |
| -------------------------------- | ------------------------------ |
| `appBootRequested`               | Orchestration complète du boot |
| `appBecameActive`                | Reprise outbox + sync          |
| `appConnectivityChanged(online)` | Reprise outbox + sync          |

Il ne contient :

* aucun accès direct au réseau
* aucune règle métier
* aucun accès aux gateways métier

Il se contente de **coordonner les bounded contexts existants**.

---

# # 🧪 Tests (philosophie)

Les tests de `runtimeListener` vérifient :

### ✔ boot “happy path”

* HYDRATION_DONE
* OUTBOX_REHYDRATE_COMMITTED
* COMMENT/OUTBOXPROCESSONCE
* WARMUP_DONE
* BOOT_SUCCEEDED

### ✔ boot “error path”

* BOOT_FAILED si un gateway initial échoue

### ✔ appBecameActive / appConnectivityChanged

* outboxProcessOnce est bien trigger

> Tests alignés avec la philosophie :
> On vérifie **les actions** dispatchées, pas les gateways.

---

# # 📦 Résumé : la responsabilité exacte de `appWl`

`appWl` garantit que :

* l’utilisateur retrouve une app cohérente partout dans son cycle de vie
* l’Outbox démarre/continue/reprend comme il faut
* la couche SYNC peut tourner en fond
* les BC reçoivent leurs données globales au bon moment
* les initialisations sont isolées, ordonnées et reproductibles
* l’app reste résiliente face :

    * aux crashs
    * aux pertes réseau
    * aux transitions background → foreground

C’est le **chef d’orchestre**, pas un BC métier.

