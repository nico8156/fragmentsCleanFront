# appWl – Runtime de l'application & orchestration Offline/Sync

`appWl` représente le **runtime de l'application** côté client.

Il orchestre :
- la **boucle de vie** de l’app (boot, foreground/background, changement de réseau)
- le **traitement de l’outbox** (`outboxWl/processOutbox.ts`)
- la **sync** avec le backend (`outboxWl/sync/...`)
- la coordination entre les contexts métier (`commentWl`, `ticketWl`, `likeWl`, `userWl`, etc.)

---

## 🌍 Vue d’ensemble

Diagramme : `appFlow.mmd`

En résumé :
1. L’UI déclenche des **usecases WL** (ex : `commentCreateWlUseCase`).
2. Ces usecases poussent des **commandes dans l’outbox** (`outboxWl`).
3. Le **runtime** (appWl) :
  - surveille l’état `appState` (foreground/background, réseau up/down)
  - déclenche le traitement de l’outbox quand c’est pertinent
4. La **sync** :
  - envoie les commandes au backend
  - écoute les événements / ACK
  - applique les ACK dans les bons contexts (commentWl, ticketWl, likeWl, userWl…)

---

## 🧠 Responsabilités de `appWl`

- connaître **l’état global de l’app** :
  - focus (foreground/background)
  - connectivité réseau
  - état de la session utilisateur
- décider **quand** :
  - rehydrater l’outbox (`outboxWl/runtime/rehydrateOutbox.ts`)
  - démarrer / arrêter la sync (`outboxWl/sync/syncEventsListenerFactory.ts`)
  - traiter un batch de commandes d’outbox (`outboxWl/processOutbox.ts`)
- garder la boucle **robuste** :
  - retry/backoff (délégué à l’outbox)
  - ne jamais bloquer l’UI
  - tolérer les transitions réseau fréquentes

---

## 🔗 Interaction avec `outboxWl` et la Sync

L’outbox est découpée en 3 briques principales :

1. **API métier de l’outbox**
  - `outboxWl/processOutbox.ts`
  - `outboxWl/utils/outboxSnapshot.ts`
2. **Runtime Outbox** (persistance & rehydratation)
  - `outboxWl/runtime/*`
3. **Sync** (communication serveur + ACK)
  - `outboxWl/sync/*`

`appWl` ne connaît pas les détails bas niveau.  
Il pilote ces briques via :
- des usecases (`runtimeListenerFactory.ts`)
- des actions Redux sur `appStateWl` + `outboxWl`

👉 Les détails d’implémentation sont documentés dans :
- `../outboxWl/README.md` (modèle + invariants outbox)
- `../outboxWl/runtime/README.md` (persistance & rehydratation)
- `../outboxWl/sync/README.md` (stratégie de sync)

---

## 🏁 Cycle de vie – scénarios clés

### Boot de l'application

1. Création du store WL (`store/reduxStoreWl.ts`)
2. Rehydratation de l’outbox (`outboxWl/runtime/rehydrateOutbox.ts`)
3. Démarrage des listeners runtime (`appWl/usecases/runtimeListenerFactory.ts`)
4. Démarrage éventuel de la sync (si user connecté + réseau OK)

### Passage en foreground/background

- foreground :
  - re-check réseau
  - éventuellement relancer la sync
  - retrigger un traitement d’outbox
- background :
  - stop listeners de sync
  - persister l’état critique (outbox, session…)

### Changement de réseau

- passage offline :
  - traitement d’outbox suspendu
  - sync stoppée
- passage online :
  - re-lancement de la sync
  - reprise du traitement d’outbox (avec backoff/reset)

---

## ➕ Ajouter un nouveau “job” runtime

Exemple : ajouter un nouveau type de commande outbox (ex: `Comment.Edit` a déjà `Comment.Create`).

1. Définir les types de commande dans `outboxWl/typeAction/...`
2. Ajouter le traitement métier dans `outboxWl/processOutbox.ts`
3. Câbler le usecase côté WL (ex: `commentUpdateWlUseCase.ts`)
4. S’assurer que la sync expose les bons événements/ACK
5. Si besoin, étendre `runtimeListenerFactory.ts` pour déclencher ce traitement dans des cas particuliers (ex : au login, après un full resync…)
