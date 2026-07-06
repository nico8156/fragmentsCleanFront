# Wiring / Composition Root (Primary Adapter)

Ce dossier est le **point d’assemblage central** de l’application.
Il correspond au *Composition Root* en Clean Architecture / Hexagonal.

Aucune logique métier ici.
Uniquement :
- instanciation
- injection
- câblage
- composition

---

## 🎯 Responsabilité

Assembler les briques suivantes :

- Gateways (infra)
- Helpers (context runtime)
- Listeners (use-cases Redux)
- Store Redux
- Projection Sync
- Outbox
- Auth
- Runtime listeners

---

## 🧱 Fichiers

### `infrastructure.ts`
Construit les dépendances techniques :

- HTTP gateways
- Projection Sync gateway
- Auth bridges
- Secure storage
- Outbox storage
- SessionRef

```txt
createInfrastructure() →
{
  gateways,
  outboxStorage,
  sessionRef,
  onSessionChanged
}
