# Flux pour le Like

Le **like** d’un `USER` déclenche **4 actions** principales :
- [schema mermaid](./like.org.schema.mmd)

---

## 1. ✅ likeOptimisticApplied
- Modification directe du **state du like** de manière *optimiste*.
- Ajout d’un like avec `pending = true`.
- Incrément du **count** (le visuel est actualisé instantanément).

---

## 2. ✅ likeEnqueued
- Modification du **state de l’outbox**.
- Ajout d’une **commande** dans la queue.
- ⚠️ Avant ajout, on applique un **squash** :
    - suppression de toutes les commandes existantes relatives à ce `targetId`
    - conservation uniquement de la **dernière intention** (ex. dernier état voulu du like).

---

## 3. ✅ likeProcess

### Happy Path
- Récupération de la **queue** de l’outbox.
- Pour chaque commande :
    1. Exécuter la requête au serveur.
    2. Retirer de la queue la commande exécutée.
    3. Mettre à jour le like avec `pending = false`.

### Tricky Path
- Récupération du message d’erreur → évaluation de son caractère **retryable**.

    - **Si OUI** :
        - Incrément de `attempts += 1`.
        - Stockage du message d’erreur.
        - Mise en attente (commande **toujours présente** dans la queue).
        - Elle sera exécutée plus tard.

    - **Si NON** :
        - Mise à jour des **deux states** :
            - **Like** : `pending = false`, `count--`.
            - **Outbox** : suppression de la commande de la queue.

---

## 4. ✅ Stockage de l’état associé à la commande
- Pas une action visible, mais un mécanisme de **snapshot**.
- Permet de retrouver l’**état exact du like** avant la création de la commande.
- Stockage de cet état en regard de l’`id` de la commande.

---
