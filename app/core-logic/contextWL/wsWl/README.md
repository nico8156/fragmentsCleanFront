# WebSocketWL — Réception des ACK serveur

## Rôle

`WebSocketWL` est responsable de la **réception des événements temps réel du backend**,
principalement les **ACK de commandes envoyées via l’Outbox**.

➡️ Il ne déclenche **aucune commande**  
➡️ Il ne contient **aucune logique métier**

---

## Ce que fait WebSocketWL

- Maintient une connexion WebSocket authentifiée
- Écoute les événements serveur
- Route chaque événement vers le bon use-case de lecture (`ack*`)
- Signale l’état de connexion au runtime applicatif

---

## Ce que WebSocketWL ne fait pas

- Pas de retry métier
- Pas de logique de synchronisation
- Pas de persistance
- Pas de décision critique (source de vérité ≠ WS)

---

## Types d’événements reçus

Exemples :

- `social.like.added_ack`
- `social.like.removed_ack`
- `social.comment.created_ack`
- `social.comment.updated_ack`
- `social.comment.deleted_ack`
- `ticket.verification.completed_ack`

Chaque événement correspond à **un ACK serveur d’une commande existante**.

---

## Architecture

### Gateway

- `WsEventsGatewayPort`
- Implémentation STOMP / SockJS
- Responsabilités :
    - connect / disconnect
    - subscription `/user/queue/acks`
    - parsing & validation des événements

---

### Listener

- `wsListenerFactory`
- Orchestration runtime :
    - connexion à la demande
    - déconnexion sur background / logout
    - re-connexion après refresh token

---

## Cycle de vie

| Situation | Action |
|---------|--------|
| App active + signedIn | Connect WS |
| App inactive / background | Disconnect WS |
| Offline | Disconnect WS |
| Token refresh | Ensure connected |
| Logout | Disconnect WS |

---

## Relation avec l’Outbox

- Le WS est **best-effort**
- Un ACK reçu :
    - déclenche un `ack*` use-case
    - réconcilie l’état local
    - drop l’outbox record

- Un ACK manqué :
    - n’est **pas bloquant**
    - sera récupéré par le **watchdog Outbox**

---

## Philosophie

> Le WebSocket est un **canal opportuniste**,  
> jamais une garantie de cohérence.

La source de vérité reste :
- le backend
- l’Outbox
- le watchdog

---

## Pourquoi ce design

- Robuste aux coupures mobiles
- Aucun coupling fort au temps réel
- WS = optimisation UX, pas dépendance fonctionnelle
