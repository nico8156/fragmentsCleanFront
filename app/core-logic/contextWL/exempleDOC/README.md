# Flux pour les Comments

Chaque scénario suit la même ossature en 4 temps :
1) `*OptimisticApplied`
2) `*Enqueued` (squash dans l’outbox)
3) `*Process` (happy / tricky path)
4) **Snapshot d’état** (lié à l’id de commande)

> Glossaire rapide :
> - `pending = true` → l’UI reflète l’intention utilisateur immédiatement.
> - **Squash** → on retire de la queue les anciennes commandes sur la même cible pour ne garder que la dernière intention.
> - **Retryable** → erreur réseau/transitoire : on garde la commande en queue et on réessaie plus tard.
> - `tempId → serverId` → résolution optimiste d’un nouvel objet créé localement.

---

## A. Create Comment

### 1. ✅ commentCreateOptimisticApplied
- Ajout d’un **comment local** avec :
    - `id = tempId` (généré client),
    - `pending = true`,
    - contenu = saisie utilisateur.
- Le **fil de discussion** s’actualise instantanément (scroll/anchor optionnel).

### 2. ✅ commentCreateEnqueued
- Ajout d’une **commande** `Comment.Create` dans l’outbox.
- **Squash** (par `draftId/tempId`) :
    - S’il existe déjà un `Comment.Create` pour ce `tempId`, on ne garde que la **dernière version** (contenu mis à jour avant envoi).
    - Toute commande `Edit`/`Delete` sur ce `tempId` **doit attendre** la résolution `serverId` (ou être rebindée après).

### 3. ✅ commentCreateProcess

#### Happy Path
- Exécuter `gateway.comments.create(draft)` ;
- Retirer la commande de la queue ;
- Mettre à jour le **comment** :
    - `pending = false`,
    - `tempId → serverId`,
    - payload serveur (horodatage, auteur normalisé…).

#### Tricky Path
- Analyser l’erreur (**retryable ?**)

    - **OUI (retryable)**
        - `attempts += 1`, stocker le message d’erreur,
        - laisser la commande **en queue** (réessai ultérieur via backoff/jitter).

    - **NON (définitive)**
        - Retirer la commande de la queue,
        - **Revert optimiste** : supprimer le comment `tempId` du state (ou marquer `failed` selon ta politique d’UX),
        - Journaliser l’erreur (toast / bannière).

### 4. ✅ Snapshot d’état
- Stocker l’**état du thread** et du **draft** au moment de la création, indexé par `commandId` (utile pour revert fin).

---

## B. Edit Comment (modifier un commentaire existant)

> Remarque : on doit être sûr d’avoir un `serverId`. Si on part d’un `tempId` (création non résolue), l’edit est **retenu** ou **fusionné** au moment où `serverId` apparaît.

### 1. ✅ commentEditOptimisticApplied
- Mise à jour **optimiste** du contenu du comment (id = **serverId**),
- `pending = true` sur ce comment (ou un champ `editing.pending = true` si tu sépares les flags).

### 2. ✅ commentEditEnqueued
- Ajout d’une **commande** `Comment.Edit` (`targetId = serverId`) dans l’outbox.
- **Squash** (par `targetId`) :
    - Conserver uniquement la **dernière version du texte** (écrase les edits antérieurs encore en queue),
    - Toute **Delete** postérieure **écrase** (supprime) les `Edit` encore en queue sur le même `targetId`.

### 3. ✅ commentEditProcess

#### Happy Path
- Exécuter `gateway.comments.edit(serverId, newContent)` ;
- Retirer la commande de la queue ;
- Mettre à jour le **comment** :
    - `pending = false`,
    - normaliser le contenu depuis la réponse serveur (anti drift).

#### Tricky Path
- **Retryable ?**
    - **OUI** → `attempts += 1`, conserver la commande en queue (backoff),
    - **NON** →
        - Retirer la commande de la queue,
        - **Revert optimiste** : restaurer l’**ancien contenu** depuis le **snapshot**,
        - Gérer erreurs métier (ex. `409 Conflict`, `404 Not Found`) :
            - `409` → recharger le commentaire ou proposer un **merge UI**,
            - `404` → marquer comme supprimé localement.

### 4. ✅ Snapshot d’état
- Stocker **l’ancienne version du contenu** + métadonnées, indexés par `commandId`, pour revert sans perte.

---

## C. Delete Comment

### 1. ✅ commentDeleteOptimisticApplied
- **Masquer** le comment dans l’UI (soft delete) :
    - soit suppression locale,
    - soit flag `deleted.pending = true` (pour show/hide selon UX).
- Optionnel : afficher un **toaster “Annuler”** tant que la commande n’est pas confirmée.

### 2. ✅ commentDeleteEnqueued
- Ajout d’une **commande** `Comment.Delete` (`targetId = serverId`) dans l’outbox.
- **Squash** (par `targetId`) :
    - Supprimer toute commande `Edit` restante sur ce `targetId`,
    - Si plusieurs `Delete` existent, garder la **dernière** (idempotent côté serveur).

### 3. ✅ commentDeleteProcess

#### Happy Path
- Exécuter `gateway.comments.delete(serverId)` ;
- Retirer la commande de la queue ;
- **Confirmer la suppression** dans le state (retirer définitivement l’item ou marquer `deleted = true` sans `pending`).

#### Tricky Path
- **Retryable ?**
    - **OUI** → `attempts += 1`, attente et réessai plus tard (la carte reste masquée s’il s’agit d’un soft delete).
    - **NON** →
        - Retirer la commande de la queue,
        - **Revert** :
            - Si tu fais un soft delete → remettre le comment visible (`deleted.pending = false`),
            - Si tu supprimes localement → **restaurer** le comment depuis le **snapshot**.

### 4. ✅ Snapshot d’état
- Sauvegarder l’**objet comment complet** (pour restauration fidèle), indexé par `commandId`.

---

## D. Règles de Squash (récap)
- **Create(tempId)** : remplace les *Create* précédents du **même tempId** (garde le dernier contenu).
- **Edit(serverId)** : remplace les *Edit* précédents du **même serverId**.
- **Delete(serverId)** : supprime tous les *Edit* restants sur le **même serverId**.
- **Edit sur tempId** : bufferiser et **re-binder** après résolution `tempId → serverId` (ou interdire tant que non résolu, selon UX).

---

## E. Idempotence & Résolution d’IDs
- **Create** : maintenir la map `tempId → serverId` (dans un `resolutionMap`) pour réconcilier l’UI, l’outbox et référentiels (réactions, réponses).
- **Delete/Edit** : côté serveur, utiliser des endpoints idempotents si possible (ou passer un `commandId`).

---

## F. Champs recommandés (state outbox + comments)
- **Outbox Command** : `commandId`, `type`, `targetId` (tempId ou serverId), `payload`, `attempts`, `lastError`, `createdAt`.
- **Comment** : `id`, `author`, `content`, `createdAt`, `updatedAt`, `pending` (ou sous-état `creating/editing/deleting`), `deleted`.

---

## G. Checklists (rapides)

### Create
- [ ] `commentCreateOptimisticApplied`
- [ ] `commentCreateEnqueued` (squash par `tempId`)
- [ ] `commentCreateProcess` (happy/tricky + `tempId → serverId`)
- [ ] Snapshot du draft + thread

### Edit
- [ ] `commentEditOptimisticApplied`
- [ ] `commentEditEnqueued` (squash par `serverId`)
- [ ] `commentEditProcess` (happy/tricky + revert si non-retryable)
- [ ] Snapshot de l’ancienne version

### Delete
- [ ] `commentDeleteOptimisticApplied` (soft hide)
- [ ] `commentDeleteEnqueued` (écrase les `Edit`)
- [ ] `commentDeleteProcess` (happy/tricky + restore si non-retryable)
- [ ] Snapshot du comment complet
