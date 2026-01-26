---

# 🧠 Outbox Frontend – Clean Architecture

> Reliable command delivery, offline-first, idempotent, event-driven, testable.

Cette outbox implémente un **pattern Outbox côté frontend** inspiré des architectures DDD / CQRS / Event-Driven, adapté au mobile (React Native / offline / lifecycle / réseau instable).

Objectif :
➡️ garantir que toute action utilisateur critique (like, comment, ticket, etc.) est :

* persistée localement
* envoyée **au moins une fois**
* **idempotente**
* résiliente aux crashes, background, offline, reboot app
* **réconciliée** proprement avec le backend

---

## 🧱 Architecture

```
UI
 │
 │ (use-cases)
 ▼
Command UseCase
 │
 ▼
OutboxPort (enqueue)
 │
 ▼
OutboxState (Redux)
 │
 ├── queue
 ├── byId
 ├── byCommandId
 │
 ▼
processOutboxFactory (delivery engine)
 │
 ▼
Gateways (HTTP / WS / SDK)
 │
 ▼
Backend
```

---

## 📦 Modèle de données

### OutboxRecord

```ts
type OutboxRecord = {
  id: string;                 // outboxId
  item: {
    command: OutboxCommand;   // Commande métier
    undo: OutboxUndo;         // Données de rollback
  };
  status: "queued" | "processing" | "awaitingAck" | "failed";
  attempts: number;
  lastError?: string;

  enqueuedAt: string;         // ISO date
  nextCheckAt?: string;       // ISO date (awaitingAck watchdog)
  nextAttemptAt?: number;     // epoch ms (retry scheduler)
};
```

---

## 🔁 Cycle de vie d’une commande

### 1) Enqueue

```txt
UI action → use-case → outbox.enqueue(command)
```

* persisté dans Redux
* persisté dans storage (snapshot)
* ajouté dans `queue`
* indexé par `commandId` (idempotence)

---

### 2) Delivery (`processOnce`)

```txt
queued → processing → (gateway call)
```

#### Cas succès :

```txt
→ awaitingAck
→ dequeue
→ nextCheckAt = now + 30s
```

#### Cas erreur :

```txt
→ rollback
→ markFailed
→ scheduleRetry (backoff exponentiel + jitter)
→ status = queued
→ retour en queue
```

---

### 3) ACK backend (WebSocket ou polling)

```txt
ACK reçu
→ reconcile state
→ dropCommitted(commandId)
→ purge outbox
```

Idempotent :

* ACK multiple = ignoré
* si déjà drop → no-op

---

### 4) Watchdog (`outboxWatchdog`)

Pour les cas où :

* websocket perdu
* ACK jamais reçu
* crash app
* reconnexion réseau

```txt
awaitingAck → commandStatus.getStatus(commandId)
```

Résultats :

* `APPLIED` → drop
* `REJECTED` → fail + drop
* `PENDING` → replanifie nextCheckAt

---

## 🔒 Garanties

### ✅ Idempotence

* index `byCommandId`
* double enqueue = ignoré
* double ACK = ignoré

### ✅ Offline-first

* persistence snapshot
* rehydrate au démarrage
* reprise automatique

### ✅ Crash-safe

* tout est persisté
* aucun état volatile critique

### ✅ Mutex

* `inFlight` empêche double process concurrent

### ✅ Retry policy

* backoff exponentiel
* jitter
* cap max
* planification via `nextAttemptAt`

---

## 🔌 Intégration Runtime

### Lifecycle app

| Événement              | Effet                                          |
| ---------------------- | ---------------------------------------------- |
| `appBecameActive`      | wsEnsureConnected + outboxResume + processOnce |
| `appBecameBackground`  | outboxSuspend + wsDisconnect                   |
| `connectivity offline` | suspend outbox                                 |
| `connectivity online`  | resume + processOnce                           |

---

## 🧪 Tests

Couverture actuelle :

* idempotence
* retry
* rollback
* awaitingAck
* mutex
* gateway missing
* watchdog
* rehydrate
* snapshot persistence
* scheduling
* eligible selection (`nextAttemptAt`)
* error paths

> Tous les flows critiques sont testés.

---

## 🧭 Philosophie

Cette outbox implémente un vrai **delivery engine** :

* séparation claire :

  * command
  * transport
  * delivery
  * retry
  * reconciliation
  * observation
* testable isolément
* découplée des gateways
* DDD compatible
* CQRS compatible
* Event-driven compatible

---

## 🧩 Positionnement architectural

Comparable à :

* transactional outbox backend
* saga orchestrator
* message dispatcher
* mobile sync engine
* offline-first command queue

---

## ✨ En résumé

Cette outbox est :

✅ déterministe
✅ testée
✅ résiliente
✅ idempotente
✅ offline-first
✅ event-driven
✅ clean architecture
✅ vitrinable
✅ production-grade

---
