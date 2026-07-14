# AppWL — Application Runtime & Lifecycle

## Rôle

`AppWL` gère **le cycle de vie runtime de l’application mobile**.
Il orchestre l’activation et la suspension des sous-systèmes techniques
(Projection Sync, Outbox, Watchdog) en fonction de l’état réel de l’app.

➡️ Aucun métier ici.  
➡️ Aucun appel réseau direct.

---

## Responsabilités

- Traduire les signaux OS / réseau en actions applicatives
- Centraliser la logique liée à :
  - foreground / background
  - online / offline
  - authentifié / non-authentifié
- Garantir un comportement fiable sur mobile (suspension, reprise)

---

## Actions principales

| Action | Signification |
|------|---------------|
| `appBecameActive` | App visible et utilisable hors reprise explicite |
| `appBecameForeground` | Retour explicite de `background`/`inactive` vers `active` |
| `appBecameInactive` | Transition courte (lock, multitâche) |
| `appBecameBackground` | App en arrière-plan |
| `appConnectivityChanged` | Changement online/offline |

---

## Architecture

- **Adapter** : `mountAppStateAdapter`
  - Écoute `react-native AppState`
  - Dispatch des actions AppWL
  - Zéro logique métier

- **Runtime Listener** : `runtimeListenerFactory`
  - Décide quoi activer / suspendre
  - Coordonne WS / Outbox / Watchdog

---

## Règles runtime

### App active / foreground
- Si **connecté + authentifié** :
  - Projection Sync connect
  - Outbox process
  - Watchdog tick

### App inactive / background
- Suspend outbox
- Déconnecte Projection Sync

### Offline
- Suspend outbox
- Déconnecte Projection Sync

---

## Pourquoi ce design

- Une seule source de vérité runtime
- Comportement prévisible
- Adapté aux contraintes mobiles réelles
- Facile à tester
