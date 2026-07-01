# AGENTS.md — Frontend (React Native / Expo / Offline-first)

## 🎯 Mission
Le frontend Fragments est une application **offline-first pilotée par événements**.

Toute évolution doit préserver la hiérarchie fonctionnelle suivante :

UI Component
→ View Model Hook
→ Selector
→ Redux Store
→ Use Case / Listener Middleware
→ Outbox
→ Secondary Gateways
→ Server ACK / Reconciliation

Le système privilégie :
- granularité
- testabilité
- robustesse réseau
- précision des transitions d’état
- séparation stricte des responsabilités

---

## 🧱 Invariants non négociables

### 1) Offline-first obligatoire
Toute écriture sensible doit rester compatible avec :
- mode hors ligne
- retry
- backoff
- reprise
- persistence
- ACK différé
- correction d’état optimiste

Ne jamais introduire un flux qui suppose une disponibilité réseau immédiate.

---

### 2) Le use case orchestre le métier
Le use case représente la réaction métier à une intention ou un événement.

Exemple de flux attendu :

UI intent
→ listener middleware
→ analyse du state courant
→ optimistic update
→ enqueue outbox
→ déclenchement du process
→ attente ACK
→ reconciliation / rollback

Le use case :
- orchestre
- choisit les actions
- prépare l’undo
- produit la commande outbox
- ne contient pas de rendu UI

---

### 3) L’outbox possède la responsabilité infra
L’outbox est la frontière de synchronisation.

Elle gère :
- persistence
- retry
- backoff
- watchdog
- process once
- polling statut
- rollback
- drop on ACK
- reprise après reconnect / foreground

Aucune logique de robustesse réseau ne doit être dupliquée ailleurs.

---

### 4) L’ACK fait partie du flux nominal
Les ACK websocket ou polling servent à :
- confirmer l’écriture
- réconcilier avec la vérité serveur
- rollback si nécessaire
- nettoyer l’outbox
- mettre à jour le feedback UI de sync

Ne jamais traiter l’ACK comme une logique “bonus”.

---

### 5) Runtime lifecycle + connectivité
Le runtime client doit rester responsable des comportements liés à :
- foreground / background
- reconnexion
- état réseau
- bootstrap
- rehydration
- websocket lifecycle
- watchdog périodique

Ces comportements doivent vivre dans les listeners runtime dédiés.

---

## 🧩 Répartition stricte des responsabilités

### UI Components
Responsables uniquement de :
- rendu
- composition visuelle
- callbacks UI
- props de présentation

Interdits :
- fetch réseau
- logique métier
- accès direct au store profond
- orchestration d’ACK
- accès gateway

---

### View Models / Hooks
Les hooks VM :
- consomment les selectors
- exposent les données prêtes à afficher
- exposent les callbacks UI
- gèrent les flags de présentation (`isLoading`, `isRefreshing`, etc.)
- peuvent gérer une logique purement UI (ex: TTL visuel)

Ils ne doivent pas :
- parler HTTP
- faire du métier write complexe
- dupliquer la logique reducer
- bypass les use cases

---

### Selectors
Les selectors doivent :
- dériver des données lisibles
- protéger le VM contre les états incomplets
- toujours fournir un contrat stable
- éviter les `undefined` inutiles côté UI
- centraliser les fallback values

Un selector n’est pas un simple getter.

---

### Reducers
Les reducers :
- restent purs
- décrivent les transitions d’état
- gèrent optimistic update / rollback / reconcile
- restent source de vérité locale du state

Aucune logique d’accès externe.

---

### Use Cases / Listener Middleware
C’est la couche d’orchestration principale.

Responsabilités :
- réagir aux intentions UI
- lire le state courant
- décider optimistic update
- produire undo + commande outbox
- déclencher process / retrieval
- router les ACK métier

Toute nouvelle feature doit commencer ici.

---

### Gateways (ports)
Les interfaces gateway décrivent :
- les contrats réseau
- storage
- location
- websocket
- secure store
- adapters natifs

Les ports doivent rester :
- petits
- métier-oriented
- testables
- sans détails UI

---

### Secondary Adapters
Les implémentations concrètes :
- HTTP
- Expo APIs
- secure store
- websocket STOMP
- storage natif

Responsabilités :
- parler au monde externe
- mapper les payloads
- gérer les erreurs techniques
- respecter strictement le port

Interdits :
- logique métier
- optimistic update
- orchestration Redux

---

## 🔁 Read flows
Une lecture réseau suit la structure :

VM / runtime
→ thunk retrieval
→ gateway.get(...)
→ reducer pending/success/error
→ selector
→ VM

Règles :
- gérer `pending/error/success`
- annuler les requêtes concurrentes quand nécessaire
- protéger contre race conditions
- ne jamais fetch depuis le composant

---

## ✍️ Write flows
Une écriture compatible offline-first suit :

UI intent
→ listener middleware
→ optimistic reducer action
→ enqueueCommitted
→ processOutbox
→ adapter externe
→ ACK websocket/poll
→ reconcile / rollback
→ dropCommitted

---

## 🔌 Wiring obligatoire
Le wiring des dépendances doit rester centralisé dans :
- `createInfrastructure`
- `createWlListeners`
- `createWlStore`

Ne jamais créer de wiring caché dans :
- composants
- hooks UI
- selectors
- reducers

---

## 🚫 Anti-patterns interdits
- appel HTTP direct dans un composant
- appel HTTP direct dans un VM
- logique métier dans gateway HTTP
- bypass du listener middleware
- bypass de l’outbox pour un write sync
- websocket qui mutate directement le store sans action métier
- selector passif sans fallback utile
- hook qui re-code la logique métier du reducer
- singleton caché hors infrastructure
- side effects dans reducer

---

## ✅ Definition of Done
Avant de conclure une tâche frontend :

### Architecture
- la hiérarchie Component → VM → Selector → Store → UseCase → Outbox est respectée
- aucun bypass architectural

### Offline-first
- retry/backoff/ACK/rollback restent cohérents
- pas de régression sur reconnect / lifecycle

### State
- optimistic + reconcile + rollback couverts si write
- selectors stables pour le VM

### Wiring
- listeners et gateways correctement branchés

### Tests
Ajouter ou adapter les tests les plus proches de la couche impactée :
- reducer
- selector
- use case
- outbox
- listener
- runtime
