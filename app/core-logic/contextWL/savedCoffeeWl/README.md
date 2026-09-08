# Favoris (`savedCoffeeWl`)

`savedCoffeeWl` porte les favoris privés de l'utilisateur. `SavedCoffee` est le
nom technique conservé dans les contrats ; l'expérience mobile utilise le mot
« favori ». Ce concept n'est pas un like social et ne dépend d'aucune donnée
locale uniquement.

```text
Fiche café / Mes favoris
-> uiSavedCoffeeToggleRequested
-> état Redux optimiste + outbox local durable
-> POST /api/users/me/saved-coffees
-> ACK opportuniste ou GET /commands/{commandId}
-> GET /api/users/me/saved-coffees
```

Le cache de lecture est réhydraté au démarrage et reste consultable sans réseau.
Un `projection.updated` avec `projection="savedCoffees"`, `scope="user"` et
l'identifiant de l'utilisateur ne modifie jamais Redux directement : il
déclenche uniquement une nouvelle récupération du snapshot serveur.

Les erreurs réseau, les timeouts et l'absence de SSE conservent l'état
optimiste et l'élément d'outbox. Seul un statut de commande `REJECTED` autorise
un rollback. L'action de favoris est désactivée pendant sa synchronisation afin
d'éviter une succession ambiguë de bascules dans l'interface.
