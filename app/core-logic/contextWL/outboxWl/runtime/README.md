# OutboxWL Runtime — Persistence, ACK & Watchdog

## Rôle

Cette couche gère :
- la persistance de l’outbox
- la reprise après crash / kill
- la récupération des ACK manquants

Elle est **100% technique**.

---

## Persistance

### Stockage utilisé

- MMKV (prioritaire)
- AsyncStorage (fallback)
- Memory (tests / dev)

### Persisté
- état de l’outbox (`byId`, `queue`, `byCommandId`)
- état du watchdog

---

## Cycle d’un record

| État | Description |
|----|------------|
| `queued` | prêt à être envoyé |
| `processing` | HTTP en cours |
| `awaitingAck` | HTTP OK, attente ACK |
| `failed` | erreur définitive |
| `dropped` | terminé |

---

## Problème clé : ACK perdu

Cas typique :
- HTTP OK
- App quittée
- ACK WS jamais reçu

➡️ Le backend **ne rejoue pas les ACK**

---

## Solution : Watchdog

- Chaque record `awaitingAck` est surveillé
- Après timeout :
  - appel `CommandStatusGateway`
  - décision finale basée sur le backend

### Résultat
- ACK synthétique → drop
- NACK → rollback / failed
- Unknown → retry plus tard

---

## Intégration runtime

Le watchdog est déclenché par :
- app active
- retour online
- tick périodique

---

## Pourquoi ce choix

- Le backend est source de vérité
- Pas de dépendance au WS
- Comportement déterministe
- Design éprouvé en mobile offline-first
