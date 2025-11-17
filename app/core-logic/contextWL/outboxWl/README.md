# 📦 Outbox Context (WL)

Le **Outbox Context** fiabilise **toutes les écritures réseau** (likes, commentaires, tickets…) et garantit une **expérience offline-first**.
Il fournit :

* une **queue persistée, idempotente**,
* un **moteur de traitement** entièrement déterministe,
* un **système de backoff avec jitter**,
* une **reprise locale** après fermeture de l'app,
* un mécanisme de **synchronisation incrémentale (delta) ou complète (full)** via un **cursor**,
* une **idempotence forte** sur les événements serveur (`appliedEventIds`).

Ce module représente le **moteur offline/online** de l'application.

---

# 🧠 1. Concepts clés

## 📌 1.1 Commandes (writes) & statuts

Chaque écriture UI (like, commentaire, ticket…) crée une **commande** qui entre dans l’Outbox.

Les commandes supportées sont définies dans :

```
typeAction/commandFor*.type.ts  
typeAction/outbox.type.ts
```

Avec :

* un `commandId` (idempotence),
* un `undo` (rollback UI si erreur),
* un statut :

```
queued → processing → awaitingAck → dropped
            ↑
         failed (avec retry)
```

---

## 📌 1.2 Idempotence

Deux niveaux d’idempotence sont garantis :

### Côté outbox (client)

* `byCommandId[commandId]` empêche l’ajout en double.

### Côté sync (serveur)

* `appliedEventIds` empêche de réappliquer un ACK déjà intégré.

---

## 📌 1.3 Retry : backoff exponentiel + jitter

Lors d’une erreur réseau :

* on **ne retire pas** la commande de la queue,
* on applique le rollback UI,
* on marque le record comme `failed`,
* on programme un retry :

```
base = min(60s, 2^attempts * 1000)
jitter = random(0–300ms)
nextAttemptAt = now + base + jitter
```

Le moteur ignore les items dont `nextAttemptAt > now`.

---

## 📌 1.4 Anti « head-of-line blocking »

Le moteur ne traite que les items :

* `status === queued`
* `nextAttemptAt <= now`

Si le premier item n’est pas éligible, le moteur **n’avance pas dessus**, ce qui évite qu’un failure bloque toute la queue.

---

## 📌 1.5 Reprise locale & snapshot

L’état de l’outbox est **persisté après chaque mutation** :

```
outboxPersistenceMiddleware → storage.saveSnapshot(...)
```

Au lancement de l’app :

```
rehydrateOutboxFactory → loadSnapshot() → sanitize → outboxRehydrateCommitted
```

Le sanitize :

* supprime les records mal formés,
* vérifie les types,
* reconstruit un `byCommandId` propre,
* reconstruit une `queue` cohérente.

---

## 📌 1.6 Sync incrémentale (delta) ou complète (full)

L’app maintient une **meta sync** :

```
cursor  
sessionId  
lastActiveAt  
appliedEventIds (borné à ~2000)
```

Le moteur de sync décide :

| Idle / session              | Décision                           |
| --------------------------- | ---------------------------------- |
| < 5 min & même session      | delta                              |
| 5–30 min                    | delta puis fallback full si erreur |
| > 30 min OU session changée | full                               |

`syncDelta({ cursor })` peut renvoyer une `CursorUnknownSyncError`.
Dans ce cas → **upgrade automatique vers full**.

---

## 📌 1.7 Replay local

Quand l’app revient active :

```
replayRequested() → eventsGateway.replayLocal() → eventsApplier
```

Permet de rejouer les événements stockés en local (mode offline).

---

# 🏗️ 2. Structure du module

```
outboxWl/
├── typeAction/        → commandes, events, actions, statuts
├── reducer/           → outboxWl.reducer.ts
├── selector/          → selecteurs stables
├── processOutbox.ts   → moteur de traitement des commandes (retry, ack…)
├── runtime/
│   ├── outboxPersistenceFactory.ts
│   ├── rehydrateOutbox.ts
│   ├── syncMetaStorage.ts
│   ├── syncEventsListenerFactory.ts
│   ├── syncRuntimeListenerFactory.ts
│   └── syncRuntime.spec.ts
├── gateway/
│   ├── outboxStorage.gateway.ts   → persistance du snapshot
│   └── eventsGateway.ts           → syncDelta / syncFull / replayLocal
├── processLike.spec.ts
├── processComment.spec.ts
└── outboxFlow.mmd
```

---

# 🚀 3. Le flux complet (exemple LikeAdd)

## 🟩 3.1 Happy path

### (1) UI → commande

L’utilisateur tappe un like → le use-case crée une commande :

```
enqueueCommitted({
  id: "obx_123",
  command: { kind: LikeAdd, commandId: "cmd_456", … },
  undo: { ... },
})
```

➡️ Persistée immédiatement via `outboxPersistenceMiddleware`.

---

### (2) Moteur outbox (trigger : outboxProcessOnce)

Le moteur :

1. récupère `queue[0]`,
2. vérifie que l’item est **éligible** (`queued`, pas de `nextAttemptAt > now`),
3. `markProcessing(id)` → attempts++,
4. route vers `gateways.likes.add(…)`,
5. succès ->

    * `markAwaitingAck(id, ackBy)`
    * `dequeueCommitted(id)`

➡️ Snapshot mis à jour.

---

### (3) Serveur → ACK

Plus tard : `like.addedAck` via eventsGateway.

`eventsApplier` :

* applique la mise à jour serveur,
* supprime `commandId` du tracking via `dropCommitted` (après ACK).

---

## 🟥 3.2 Error path + retry

### (1) Le gateway throw

processOutbox catch l’erreur :

* rollback UI via `undo`,
* `markFailed(id, lastError)`,
* calcule `nextAttemptAt` (exponential backoff + jitter),
* `scheduleRetry(id, nextAttemptAt)`.

### (2) Prochain `outboxProcessOnce`

Le moteur voit :

```
record.nextAttemptAt > now → skip
```

Il passe à l’item suivant → **anti head-of-line blocking**.

### (3) Quand now >= nextAttemptAt

L’item redevient éligible et est retenté.

---

# 🔁 4. Resynchronisation après pause ou kill

Quand l’app redevient active :

```
replayRequested()
syncDecideRequested()
outboxProcessOnce()
```

### Replay

Lit les events locaux → applique idempotemment.

### Sync

Décide automatiquement :

* delta (rapide)
* ou full (sécurité)
* fallback delta → full si `cursorUnknown`.

### Persistance

Chaque sync met à jour :

* `cursor`,
* `sessionId`,
* `lastActiveAt`,
* `appliedEventIds`.

---

# 🛠️ 5. Ajout d’une nouvelle commande (ex. SharePost)

1. Ajouter le type : `commandForShare.type.ts`
2. Étendre `commandKinds`
3. Dans `processOutbox.ts` → ajouter un `case` spécifique
4. Dans `undo` → définir le rollback
5. Dans `syncEventsListenerFactory.ts` → ajouter les ACK correspondants
6. Ajouter les tests :

    * happy path,
    * erreur,
    * retry,
    * idempotence ACK.

---

# 📊 6. Visualisation du flux

Voir :

```
outboxFlow.mmd
```

Diagramme représentant :

```
UI → optimistic → enqueue → process → gateway → ACK → drop
AppState/NetInfo → replay → process → sync
```

---

# 🎯 7. Objectifs atteints

Ce module garantit :

* **0 double write**, grâce à `commandId` & `appliedEventIds`,
* **résilience offline**, grâce aux snapshots + rehydrate,
* **pas de blocage**, grâce au skip + retry éligible,
* **traitement déterministe**, basé sur une queue visible et testée,
* **reprise après crash**, via syncFull,
* **performance**, grâce à delta sync,
* **précision serveur**, via ACK & reconcile.
