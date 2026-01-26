# 📦 OutboxWL — Client Outbox Architecture

## Purpose

OutboxWL implémente un **Outbox Pattern côté frontend mobile** permettant :

* offline-first
* retry automatique
* idempotence
* ACK différés
* résilience réseau
* cohérence finale
* UX optimiste

> Ce n’est pas une queue UI.
> 👉 C’est un **orchestrateur de commandes distribuées**.

---

## Concept

Chaque action utilisateur est transformée en :

```
Command + Undo
```

Puis persistée dans l’outbox locale.

---

## State Model

```ts
type OutboxState = {
  byId: Record<string, OutboxRecord>
  queue: string[]                 // uniquement status=queued
  byCommandId: Record<string,string>
  suspended: boolean
}
```

```ts
type OutboxRecord = {
  id: string
  item: { command, undo }
  status: 'queued' | 'processing' | 'failed' | 'awaitingAck'
  attempts: number
  enqueuedAt: ISODate
  nextAttemptAt?: number   // retry scheduler
  nextCheckAt?: ISODate    // watchdog ACK
  lastError?: string
}
```

---

## Pipeline

### 1. Enqueue

```
UI -> UseCase -> outbox.enqueue()
```

### 2. Delivery

```
runtime -> outboxProcessOnce
```

### 3. Gateway call

```
processOutbox -> gateway
```

### 4. Await ACK

```
markAwaitingAck
```

### 5. ACK via WS

```
WS -> ACK Listener -> reconcile -> dropCommitted
```

---

## Retry model

```txt
failure ->
  markFailed ->
  computeNextAttemptAt ->
  scheduleRetry ->
  queued
```

Backoff exponentiel + jitter.

---

## Watchdog (ACK observer)

Quand `status = awaitingAck` :

```
watchdog ->
  commandStatusGateway.getStatus()
```

### Verdicts

* **APPLIED** → `dropCommitted` + `outboxProcessOnce`
* **REJECTED** → `markFailed` + `dropCommitted`
* **PENDING** → replanification `nextCheckAt(now + 5s)`

---

## Persistence

Snapshot persisté automatiquement sur actions :

```
enqueueCommitted
markProcessing
markFailed
markAwaitingAck
scheduleRetry
dropCommitted
dequeueCommitted
```

* debounce: `75ms`
* crash-safe
* replay-safe

---

## Runtime Integration

Piloté par :

* AppState
* NetInfo
* Auth
* WS lifecycle

---

## Guarantees

* idempotence par `commandId`
* retry sûr
* duplicate ACK safe
* crash safe
* offline safe
* reconnect safe
* deterministic replay

---

## Properties

* CQRS client-side
* Event-driven
* Deterministic state machine
* Observable
* Testable
* Portable

---

## Mental Model

> The outbox is not a queue.
> It’s a **distributed command coordinator**.

---

## This enables

* mobile CQRS
* frontend saga
* offline workflows
* distributed UX
* resilient mobile systems

---

## Positioning

OutboxWL n’est pas une feature.
C’est une **infrastructure applicative**.

Elle joue le rôle de :

* CommandBus client
* Saga engine mobile
* Retry coordinator
* Offline orchestrator
* Distributed state reconciler

---

## Résumé

OutboxWL =

> Un système distribué embarqué dans une app mobile.

Avec :

* orchestration
* persistance
* reprise
* cohérence
* tolérance aux pannes

Ce n’est pas du Redux.
Ce n’est pas une queue.
Ce n’est pas un middleware.

C’est une **architecture distribuée client-side**.

