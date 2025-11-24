# Tests – core-logic / contextWl

Ce dossier contient **tous les tests de la core-logic WL** (sans UI, sans réseau, sans storage réel).

L'idée :
> Tester **le domaine client** comme une librairie pure, avec **contrôle total** sur les dépendances.

---

## 🎯 Philosophie générale

- **Tests unitaires au sens “domaine”**  
  On teste :
    - les `reducers` (évolution d’état)
    - les `usecases` (orchestration métier + dispatch d’actions)
    - certains **scénarios end-to-end WL** (ex : création de commentaire + ACK)

- **Toujours avec des fakes**  
  Aucune dépendance réelle :
    - pas de vrai réseau
    - pas de vrai storage natif
    - pas de vrai GPS, pas d’horloge système non maîtrisée

  On utilise :
    - des **fakes maison** (comme ceux de `app/adapters/secondary/fake/...`)
    - ou des petites implémentations in-memory dans les tests

- **Contrôle total**  
  Le test contrôle :
    - le temps (timestamps, backoff, etc. fournis en paramètre)
    - les réponses des gateways (succès, erreurs, timeouts simulés)
    - les événements entrants (ACK, events serveur)

  👉 Aucun “hasard”, aucun IO caché : tout est **déterministe**.

---

## 🧱 Organisation

Les tests miroirent la structure de `app/core-logic/contextWl` :

- `tests/core-logic/contextWl/appWl/...`
- `tests/core-logic/contextWl/outboxWl/...`
- `tests/core-logic/contextWl/commentWl/...`
- etc.

Exemples :
- `outboxWl/processTicket.spec.ts` → teste la logique de `processOutbox.ts` pour les tickets
- `commentWl/usecases/write/commentCreateWlUseCase.spec.ts`  
  → teste le usecase de création de commentaire, avec fakes côté gateways
- `outboxWl/runtime/rehydrateOutbox.spec.ts`  
  → teste la rehydratation depuis un fake storage

Les fichiers `*.integration.spec.ts` restent :
- **in-memory**
- sans réseau
- mais couvrent plusieurs briques en même temps (ex: usecase + reducer + outbox).

---

## 🧪 Style des tests

- Nom des tests orienté **scénario métier** plutôt que détails techniques.
- Structure classique :
    - **Given** : état initial + fakes configurés
    - **When** : appel du usecase / reducer
    - **Then** : état WL attendu (store, outbox, events dispatchés…)

Le but est que les tests puissent servir de **documentation exécutable** du comportement métier WL.

---

## ▶️ Exécution

Les tests se lancent via le runner configuré dans le projet  
(par ex. Jest / Vitest – voir `package.json`), typiquement :

```bash
npm test
# ou
pnpm test
