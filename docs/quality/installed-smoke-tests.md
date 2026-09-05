# Smoke tests sur application installée

Ces tests complètent Jest : ils exercent un build installé, SecureStore, MMKV,
la navigation native et les gateways HTTP réelles contre staging.

## Préconditions

- build développement installé avec l’identifiant `com.nico8156.fragments` ;
- onboarding et connexion Google réalisés une première fois ;
- un café `PUBLISHED` et un article `PUBLISHED` connus dans Studio ;
- Maestro installé sur le poste et simulateur/terminal démarré.

```bash
CAFE_ID=<uuid-publie> ARTICLE_SLUG=<slug-publie> \
  maestro test .maestro/smoke-read-models.yaml
```

Le scénario valide le redémarrage authentifié, la récupération du catalogue
café, le détail issu des projections et le détail article. Pour vérifier une
publication Studio, lancer le scénario avant publication (détail absent),
publier, puis le relancer avec les identifiants publiés.

Après une première synchronisation en ligne :

```bash
maestro test .maestro/smoke-offline-cache.yaml
```

Ce scénario coupe réellement le réseau, tue l’application, la relance et
vérifie que les écrans issus du cache restent disponibles. Il couvre aussi
l’absence temporaire du SSE : aucun signal de fraîcheur n’est requis pour
relire le snapshot durable.

## Scénarios nécessitant encore une exécution supervisée

L’écran Google est externe à l’application et ne doit pas recevoir de compte
ou mot de passe dans le dépôt. Le smoke d’authentification est donc exécuté
manuellement sur un build propre : connexion Google, retour à `home-screen`,
fermeture puis relance.

Le test de token expiré doit attendre l’expiration réelle ou utiliser un token
court émis par un environnement de test. On vérifie alors : refresh réussi en
ligne ; session conservée hors ligne ; déconnexion seulement sur rejet explicite
du refresh token. Aucun hook secret ou faux token n’est ajouté au build produit.

La création offline et sa réconciliation restent couvertes de façon
déterministe par les tests use case/outbox. Le smoke installé correspondant se
fait en mode avion : créer l’opération, vérifier la pastille en attente,
réactiver le réseau, puis attendre `APPLIED` via ACK opportuniste ou polling
`/commands/{commandId}`.
