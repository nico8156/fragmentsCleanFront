# OutboxWL — Fiabilité des commandes utilisateur

## Objectif

L’Outbox garantit que **toute intention utilisateur est traitée de manière fiable**,
même en cas de :
- perte réseau
- fermeture de l’app
- latence serveur
- ACK WebSocket manquant

---

## Cas couverts

- Like / Unlike
- Comment (create / update / delete)
- Ticket submission / verification
- Toute commande nécessitant :
  - retry
  - idempotence
  - ACK serveur

---

## Principe

Intent utilisateur
↓
Outbox (persistée)
↓
HTTP command
↓
ACK WS (si reçu)
↓
Réconciliation + drop


---

## Garanties

| Garantie | Description |
|--------|------------|
| Idempotence | `commandId` |
| Retry | backoff exponentiel |
| Résilience mobile | persistance locale |
| Pas de doublon | mapping `commandId → record` |
| Rattrapage ACK | watchdog |

---

## Ce que l’outbox ne fait pas

- Pas de synchronisation globale
- Pas de logique métier
- Pas de replay serveur automatique

---

## Philosophie

> L’Outbox protège **l’intention utilisateur**,  
> pas la cohérence globale du système.
