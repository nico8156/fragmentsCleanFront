# outboxWl/sync – Stratégie de synchronisation & écoute des événements

Ce module gère la **communication avec le backend** pour l’outbox.

---

## 🎯 Objectifs

- envoyer les commandes de l’outbox au backend
- écouter les **événements serveur** (ACK, mises à jour)
- propager les ACK vers les bons contexts WL (comments, likes, tickets, user…)
- décider **quand** relancer ou stopper la sync en fonction :
    - de l’état réseau
    - de la présence d’un user connecté
    - de la taille de l’outbox

---

## 🧱 Composants

- `syncEventsListenerFactory.ts`
    - fabrique les listeners d’événements serveur
    - connecte les événements entrants aux reducers WL

- `syncRuntimeListenerFactory.ts`
    - pilotage runtime de la sync (start/stop en fonction de l’état app)

- `syncStrategy.ts`
    - règles métier de sync (retry, backoff, full resync, etc.)

---

## 🔗 Intégration avec `appWl`

`appWl` :
- fournit le **contexte de vie** (appstate, réseau, session user)
- appelle les factories de sync pour démarrer/arrêter les listeners
- coordonne la sync avec le traitement d’outbox

Pour la vue d’ensemble du runtime : voir `../../appWl/README.md`.
