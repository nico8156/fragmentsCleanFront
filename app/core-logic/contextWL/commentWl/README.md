# Comment Context (WL)

Ce dossier orchestre la gestion des commentaires dans l'application "Fragments" côté worklog (WL). Il propose une architecture en couches :

- **Use cases** (middleware Redux Toolkit) pour les intentions UI (création, édition, suppression, récupération) et la réaction aux ACK temps réel.
- **Réducteur** pour maintenir l'état `cState` normalisé (catalogue d'entités + vues par cible).
- **Sélecteurs** pour exposer un modèle de vue aux adaptateurs React/React Native.
- **Outbox WL** pour fiabiliser les écritures réseau avec reprises automatiques et rollbacks.
- **Gateways** (dont un fake) pour interagir avec les APIs ou un backend simulé.

## Modèle de données

Les entités et l'état sont définis dans `type/commentWl.type.ts` :

- `CommentEntity` regroupe les métadonnées (auteur, dates, modération, compteurs, indicateur `optimistic`).
- `CommentsStateWl` combine un catalogue `EntityState` et des vues par café (`View`) contenant pagination (`nextCursor`, `prevCursor`), filtres, et informations de rafraîchissement (`anchor`, `lastFetchedAt`, `staleAfterMs`).
- Les opérations (`opTypes`) distinguent `retrieve` (snapshot initial), `older` (pagination descendante) et `refresh` (nouveaux éléments).

## Use cases d'écriture

### Création (`commentCreateWlUseCase.ts`)

1. **Validation** de l'entrée UI (trim + longueur minimale).
2. **Hydratation optimistic** via `addOptimisticCreated` (temp ID, auteur courant, `optimistic=true`).
3. **Enqueue** d'une commande outbox `CommentCreate` avec undo local pour rollback.
4. **Déclenchement** du worker `outboxProcessOnce`.

Les IDs temporaires et commandes peuvent être contrôlés par des helpers d'injection (tests, instrumentation).【F:app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase.ts†L4-L67】

### Mise à jour (`commentUpdateWlUseCase.ts`)

- Vérifie l'existence de l'entité locale puis applique `updateOptimisticApplied` (body, `editedAt`, flag optimistic).
- Enfile une commande `CommentUpdate` avec undo (ancien body/version) avant de lancer `outboxProcessOnce`.

Cette approche garde le commentaire affiché à jour instantanément tout en autorisant un rollback en cas d'échec réseau.【F:app/core-logic/contextWL/commentWl/usecases/write/commentUpdateWlUseCase.ts†L1-L54】

### Suppression (`commentDeleteWlUseCase.ts`)

- Transforme la suppression en **soft delete** local (pose un "tombstone" avec `SOFT_DELETED`).
- Ajoute une commande `CommentDelete` et un undo complet (body, version, `deletedAt`).

On conserve l'ID dans les threads pour éviter les trous et faciliter un rollback ultérieur.【F:app/core-logic/contextWL/commentWl/usecases/write/commentDeleteWlUseCase.ts†L1-L57】

## Use cases de lecture

### Récupération (`usecases/read/commentRetrieval.ts`)

- Gère un cache `AbortController` par couple `(targetId, op)` pour annuler les requêtes concurrentes.
- Émet les actions `Pending` → `Retrieved`/`Failed` qui alimentent le reducer.
- Normalise les réponses via `commentsRetrieved` (items, curseurs, watermark serveur).

Cette logique évite les réponses obsolètes et simplifie la pagination incrémentale.【F:app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval.ts†L1-L61】

### ACK temps réel (`usecases/read/ackReceivedBySocket.ts`)

- Écoute les ACK `create/update/delete` (ex: WebSocket) pour **reconcilier** l'état local (`createReconciled`, `updateReconciled`, `deleteReconciled`).
- Déclenche `dropCommitted` dans l'outbox si la commande correspondante a été traitée.

On garantit ainsi que les commandes quittent la file uniquement après confirmation serveur.【F:app/core-logic/contextWL/commentWl/usecases/read/ackReceivedBySocket.ts†L1-L53】

## Réducteur

Le réducteur (`reducer/commentWl.reducer.ts`) s'appuie sur un `EntityAdapter` triant les commentaires par `createdAt` décroissant.

Fonctionnalités clés :

- **Insertion optimiste** : `mergeUniquePrepend` place les nouveaux commentaires en tête, sans doublons, et incrémente le `replyCount` du parent si besoin.【F:app/core-logic/contextWL/commentWl/reducer/commentWl.reducer.ts†L36-L78】
- **Reconciliation** : `createReconciled`, `updateReconciled`, `deleteReconciled` remplacent les entités temporaires par les versions serveur et neutralisent le flag `optimistic`.【F:app/core-logic/contextWL/commentWl/reducer/commentWl.reducer.ts†L79-L130】
- **Rollback** : en cas d'échec dans l'outbox, les actions `createRollback`, `updateRollback`, `deleteRollback` réparent l'état précédent (suppression du temp ID, restauration du body/version, décrément du `replyCount`).【F:app/core-logic/contextWL/commentWl/reducer/commentWl.reducer.ts†L131-L170】
- **Gestion des vues** : pour chaque opération (`retrieve`, `older`, `refresh`), le reducer ajuste l'ordre des IDs, les curseurs et les métadonnées de rafraîchissement (`lastFetchedAt`, `anchor`).【F:app/core-logic/contextWL/commentWl/reducer/commentWl.reducer.ts†L171-L208】

## Outbox WL

`processOutbox.ts` centralise l'envoi des commandes `Comment*` :

1. Sélectionne la première commande en file (`status=queued`).
2. Résout le gateway requis (`deps.gateways?.comments`).
3. Marque la commande `processing`, exécute l'appel réseau et bascule en `awaitingAck` en attendant une confirmation serveur.
4. Sur échec, déclenche les undo (`createRollback`, `updateRollback`, `deleteRollback`).

Cette mécanique garantit l'ordre des écritures, supporte la reprise après échec et évite les doublons serveur.【F:app/core-logic/contextWL/outboxWl/processOutbox.ts†L1-L157】

## Intégration Vue/React Native

### Hook `useCommentsForCafe`

- Compose le sélecteur Reselect (`selectCommentsForTarget`) pour limiter les recalculs.【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L35-L57】
- Formate un `CommentItemVM` (avatar dérivé de l'`authorId`, relative time, statut de transport selon l'outbox).【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L63-L111】
- Déclenche automatiquement une récupération initiale / rafraîchissement selon la fraîcheur (`lastFetchedAt`, `staleAfterMs`).【F:app/adapters/secondary/viewModel/useCommentsForCafe.ts†L113-L148】

### Composant `CommentsArea`

- Affiche la liste avec styles conditionnels (`optimistic`, `failed`).
- Gère la saisie et appelle `uiViaHookCreateComment` en appliquant un trim + reset local.【F:app/adapters/primary/react/features/map/components/CommentsArea.tsx†L21-L111】

## Gateway fake

`FakeCommentsWlGateway` simule un backend :

- Renvoie des jeux de données seeds lors d'un `list` standard.【F:app/adapters/secondary/gateways/fake/fakeCommentsWlGateway.ts†L1-L85】【F:app/adapters/secondary/gateways/fake/fakeCommentsWlGateway.ts†L119-L138】
- Lors de `create`, stocke la commande, planifie un ACK aléatoire (2 à 4s) qui pousse le nouveau commentaire et déclenche `onCommentCreatedAck`.【F:app/adapters/secondary/gateways/fake/fakeCommentsWlGateway.ts†L87-L118】【F:app/adapters/secondary/gateways/fake/fakeCommentsWlGateway.ts†L139-L178】

Cette passerelle permet de tester l'ensemble du flux (optimistic → outbox → ack → reconciliation) sans backend réel.

## Optimisations clés

- **Normalisation via EntityAdapter** : lookup O(1) et diff minimal lors des updates.
- **Outbox + ACK** : tolérance réseau et cohérence forte (pas de double envoi, rollback géré).
- **AbortController par requête** : évite les race conditions lors des rafraîchissements rapides.
- **Selectors mémoïsés** : évite de recréer des tableaux inutilement côté UI.
- **Données de fraîcheur (`staleAfterMs`)** : limite les appels réseau en se basant sur un TTL configurable.

## Points d'extension

- Brancher un vrai gateway (REST/GraphQL) en implémentant `CommentsWlGateway`.
- Ajouter un traitement pour les commandes `update/delete` dans la fake gateway si besoin.
- Connecter les ACK websocket réels dans `ackListenerFactory`.
- Étendre les vues (`filters.mineOnly`, tri `top`) en enrichissant `View` et les reducers associés.

