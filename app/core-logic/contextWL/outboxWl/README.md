# outboxWl – File de commandes offline

`outboxWl` gère la **file de commandes** à envoyer au backend.

Objectifs :
- permettre à l’UI d’être **optimiste** (likes, commentaires, tickets…)
- **persister** les commandes tant qu’elles ne sont pas confirmées
- **rejouer** les commandes en cas de perte de réseau / crash app
- traiter les commandes avec **backoff** + **idempotence**

---

## 📦 Modèle

### Types de commandes

- `commandForComment` : création / update / delete de commentaire
- `commandForLike` : toggles de like
- `commandForTicket` : vérification / soumission de ticket

Voir :
- `typeAction/commandForComment.type.ts`
- `typeAction/commandForLike.type.ts`
- `typeAction/commandForTicket.type.ts`

### État outbox

- liste ordonnée de commandes
- métadonnées de persistance (`outboxPersistence.types.ts`)
- métadonnées de sync (`syncMeta.types.ts`)

---

## 🧠 Responsabilités de `outboxWl`

- enregistrer les commandes émises par les usecases WL
- exposer un **snapshot** consommable par le runtime (`outboxSnapshot.ts`)
- appliquer les effets d’ACK (succès/erreur) via les actions outbox
- coopérer avec :
  - le **runtime outbox** (`runtime/*`) pour la persistance
  - la **sync** (`sync/*`) pour l’envoi au serveur

---

## 🔁 Découpage interne

- `processOutbox.ts`  
  → logique de traitement métier d’un batch de commandes

- `runtime/`  
  → persistance & rehydratation outbox (voir `runtime/README.md`)

- `sync/`  
  → stratégie de sync + listeners réseau/ACK (voir `sync/README.md`)

---

## 🔬 Tests

Les tests dédiés à l’outbox sont dans :

- `tests/core-logic/contextWl/outboxWl/processComment.spec.ts`
- `tests/core-logic/contextWl/outboxWl/processLike.spec.ts`
- `tests/core-logic/contextWl/outboxWl/processTicket.spec.ts`
- `tests/core-logic/contextWl/outboxWl/runtime/*.spec.ts`
- `tests/core-logic/contextWl/outboxWl/sync/*.spec.ts`

Ils vérifient :
- la transformation de l’état outbox
- l’application correcte des ACK
- la robustesse face aux cas réseau (retry, backoff…)
