

---

# Primary Adapters (React / Runtime / Wiring)

La couche **primary** regroupe tout ce qui “pilote” le domain depuis l’extérieur :

* **UI React** (écrans Expo, navigation)
* **Runtime** (cycle de vie mobile, connectivité)
* **Wiring** (composition root / DI)

👉 Elle traduit des signaux externes (UI + système + SSE projection sync) en **intentions** et **actions** consommées par les bounded contexts (`core-logic/contextWL/*`).

---

## Vue d’ensemble

```txt
React UI (screens)
  ↓ intentions (dispatch)
Redux store (store/)
  ↓ listeners (usecases)
Domain (core-logic/)
  ↓ gateways (ports)
Infra (adapters/secondary/)
  ↑ projection.updated (SSE) + HTTP snapshots
```

---

## Dossiers

### `react/`

**Présentation** (Expo + React Navigation + components).

* Écrans / navigation / thème
* Consomme des view-models/hooks de `adapters/secondary/viewModel`
* Déclenche des intentions UI (actions Redux)

**Fichiers clés :**

* `react/navigation/RootNavigator.tsx`
* `react/AppBootstrap.tsx`

---

### `runtime/`

**Cycle de vie applicatif**.

**Responsabilités :**

* bootstrap
* signaux système
* connectivité
* warmup
* rehydrate outbox

---

### `wiring/`

**Composition Root**.

**Responsabilités :**

* instanciation des gateways
* création des helpers
* assemblage des listeners
* création du store Redux

**Point d’entrée :**

* `createWlStore()`

---

## Bootstrap applicatif

```txt
_layout.tsx
 ├ Provider(store)
 ├ AppBootstrap()   ← runtime
 └ RootNavigator()  ← UI
```

---

## Flux Projection Sync

```txt
Backend
 → SSE projection.updated
   → projectionSyncListenerFactory
     → dispatch(retrieval GET)
       → reducer snapshot
```

---

## Principes architecturaux

* Clean Architecture
* Hexagonal
* Event-driven
* CQRS-compatible
* Offline-first
* Runtime orchestré
* Domain pur

---

## Objectif

Une architecture :

* lisible
* maintenable
* testable
* scalable
* robuste face aux changements d’infrastructure
* stable long terme

---

## 🧠 Lecture rapide

> UI = intentions
> Runtime = orchestration
> Wiring = composition
> Socket = transport
> Domain = logique métier
> Infra = implémentation technique

---
