# Fragments – App mobile offline-first

Fragments est une application mobile autour du café, pensée **offline-first** :
- état métier centralisé dans `core-logic/contextWl`
- UI React Native dans `app/adapters/primary/react`
- synchro réseau pilotée par un **runtime client** + un **outbox** client

Ce repo contient :
- l'UI (écran, navigation, view models)
- le domaine client (contexts `*Wl`)
- l'orchestration offline / sync (runtime + outbox)
- les tests de core-logic (`tests/core-logic/contextWl/...`)

---

## 🧱 Architecture haut niveau

- `app/`
   - `adapters/primary/react`: UI, navigation, wiring des gateways
   - `adapters/secondary`: implémentations concrètes des gateways (HTTP, location, storage…)
   - `core-logic/contextWl`: cœur métier côté client (contexts `articleWl`, `coffeeWl`, `outboxWl`, `userWl`, etc.)
   - `store/`: store Redux WL + middlewares
- `tests/`
   - `core-logic/contextWl`: tests unitaires/intégration alignés sur chaque contexte WL

Le **runtime de l’app** vit dans `app/core-logic/contextWl/appWl`.  
C’est lui qui orchestre :
- la boucle de vie de l’application (boot, foreground/background)
- la gestion de l’**outbox** (`outboxWl`)
- la **sync** (écoute des événements serveur, application des ACK, etc.)

👉 Pour comprendre le runtime + l’outbox + la sync : voir  
`app/core-logic/contextWl/appWl/README.md`

---

## 🧩 Contexts WL

Chaque `*Wl` suit la même structure :

- `gateway/`: ports vers le monde externe
- `reducer/`: état + transitions locales
- `selector/`: vue dérivée pour la lecture
- `typeAction/`/`type/`: types et actions
- `usecases/`: logique applicative (lecture / écriture)

Exemples :
- `coffeeWl`: récupération des cafés, recherche, filtres…
- `commentWl`: création / suppression / mise à jour de commentaires + ACK
- `ticketWl`: gestion des tickets + badges
- `outboxWl`: file de commandes client à synchroniser
- `userWl`: user, session et badges

---

## ✅ Tests

Les tests de `core-logic/contextWl` sont rangés en miroir dans :

`tests/core-logic/contextWl/<context>Wl/...`

Exemples :
- `tests/core-logic/contextWl/outboxWl/processTicket.spec.ts`
- `tests/core-logic/contextWl/commentWl/usecases/write/commentCreateWlUseCase.spec.ts`
- `tests/core-logic/contextWl/appWl/usecases/runtimeListener.spec.ts`

---

## 📚 Où lire ensuite ?

- 🧠 **Runtime + Sync + Outbox (vue globale)**  
  → `app/core-logic/contextWl/appWl/README.md`
- 📦 **Détails de l’outbox**  
  → `app/core-logic/contextWl/outboxWl/README.md`
- 🔁 **Détails runtime Outbox**  
  → `app/core-logic/contextWl/outboxWl/runtime/README.md`
- 🌐 **Détails Sync**  
  → `app/core-logic/contextWl/outboxWl/sync/README.md`
