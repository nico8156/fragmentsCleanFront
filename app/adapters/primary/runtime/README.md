# Runtime / Application Bootstrap

Ce dossier gère le **cycle de vie applicatif** (runtime) de l’application.

Il ne contient **aucune logique métier**  
Il ne contient **aucune logique UI**  
Il orchestre uniquement le **démarrage, l’hydration et les signaux système**.

---

## 🎯 Responsabilités

- Initialisation de l’application
- Bootstrap Redux
- Hydration du state
- Initialisation auth
- Rehydratation de l’outbox
- Warmup des données globales
- Gestion du lifecycle mobile
- Gestion réseau (online/offline)
- Orchestration runtime

---

## 🧱 Fichiers

### `AppBootstrap.tsx`

Point d’entrée runtime au montage React.

### Pipeline exécuté :

```txt
Mount React
 ↓
Mount adapters (AppState + NetInfo)
 ↓
Hydration Redux
 ↓
Auth init
 ↓
Outbox rehydrate
 ↓
Outbox process (si conditions OK)
 ↓
Warmup data
 ↓
Runtime steady-state

