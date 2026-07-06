# projectionSyncWl

`projectionSyncWl` est le canal mobile generique de fraicheur des projections.

Il ne transporte pas de Domain Events. Le seul evenement route cote client est :

```text
projection.updated
```

Le listener Redux applique la regle suivante :

```text
projection.updated
-> action de recuperation HTTP du read model concerne
-> reducer read model
```

Le SSE ne mute jamais directement un store metier.

## Protocole

- `sync.connected` et `sync.heartbeat` sont ignores par les workflows metier.
- `id` SSE est memorise.
- `Last-Event-ID` est envoye a la reconnexion.
- La reconnexion utilise un backoff progressif.
- Les logs ne contiennent jamais le token bearer.

Domaines migres :

- `comments`, avec `scope="target"` et `entityId=targetId`, declenche `commentRetrieval(refresh)`.
- `likes`, avec `scope="target"` et `entityId=targetId`, declenche `likesRetrieval`.
