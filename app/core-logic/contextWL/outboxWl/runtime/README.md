# outboxWl/runtime – Persistance & Rehydratation

Ce module encapsule **comment** l’outbox est stockée et restaurée.

---

## 🎯 Objectifs

- persister l’outbox dans un storage natif (`outboxStorage.gateway.ts`)
- recharger l’état au démarrage (`rehydrateOutbox.ts`)
- exposer une **factory** qui câble tout avec les gateways d’implémentation (`outboxPersistenceFactory.ts`)

---

## 🔌 Gateways

- `outboxStorage.gateway.ts` : port abstrait vers le stockage
  - implémentation concrète : `app/adapters/secondary/gateways/outbox/nativeOutboxStorage.ts`

---

## 🔁 Cycle

1. Au boot : `rehydrateOutbox.ts` lit depuis le storage natif.
2. À chaque changement critique : l’état outbox est re-persisté.
3. En cas de crash : au reboot, l’outbox est restaurée avant la reprise de la sync.

Les détails d’orchestration globale (quand on rehydrate, quand on persiste) se trouvent dans `appWl/README.md`.
