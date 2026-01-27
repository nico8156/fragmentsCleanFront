---

## 🎯 Responsabilités

- Connexion WebSocket
- Auth handshake
- Reconnexion automatique
- Souscription aux topics
- Validation des événements entrants
- Routing des events vers le domain
- Gestion du lifecycle WS

---

## 🧱 Fichiers

### `WsStompEventsGateway.ts`

Implémentation technique WebSocket :

- SockJS
- STOMP
- Auth par token
- Subscription `/user/queue/acks`
- Validation des messages
- Dispatch des events

Rôle : **transport uniquement**  
→ aucune logique métier

---

### `ws.gateway.ts`

Port (interface) WebSocket du domain.

Définit le contrat :

```ts
connect()
disconnect()
isActive()

