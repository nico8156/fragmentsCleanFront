# Home : composition de lectures

Le Home n'est pas un bounded context ni une source de vérité. Il compose les
lectures Redux déjà possédées par `articleWl`, `coffeeWl`, `entitlementWl` et
`experienceWl` dans `homeContentViewModel`.

- le hero éditorial et son bandeau de scroll restent la responsabilité de
  `MasterHeader` ;
- les cafés viennent du catalogue local et la géolocalisation ne fait que
  modifier le libellé et le tri déjà calculé par `coffeeWl` ;
- les cinq premiers cafés du tri de découverte sont présentés dans un rail
  horizontal compact : la longueur du Home reste stable et « Voir la carte »
  ouvre le parcours exhaustif ;
- la prochaine étape est dérivée des entitlements serveur : seul un besoin de
  ticket propose le scan ;
- les expériences affichées sont celles de l'utilisateur, publiées et visibles ;
- les trois premières expériences visibles sont présentées dans un second rail
  horizontal ; « Tout voir » reste la destination exhaustive ;
- le hero prend les articles publiés classés « à la une » dans Studio, par rang
  de 1 à 5. Tant qu'aucun rang n'est attribué, le plus récent reste le seul
  grand visuel provisoire : le rendu du grand visuel et du bandeau au scroll
  demeure intact ;
- « À lire ensuite » conserve une liste verticale : les trois articles publiés
  non mis à la une les plus récents, hors article déjà visible dans le hero.
  C'est une sélection déterministe, sans recommandation algorithmique ;
- « Tous les articles » ouvre un catalogue distinct contenant tous les articles
  publiés, même ceux à la une, du plus récent au plus ancien ;
- aucune donnée fictive ne remplace une lecture absente : l'UI montre un état
  vide avec une destination explicite.

Cette composition reste read-only. Toute écriture conserve le flux écran →
view model → use case Redux → outbox.

Le Home peut être tiré vers le bas pour recharger les projections publiques et,
si connecté, les expériences personnelles et le Pass. Au retour au premier
plan ou après une reconnexion, les projections publiques sont aussi relues ;
Projection Sync SSE reste un simple signal pour effectuer un GET. Le grand
visuel `MasterHeader` et l'apparition du bandeau au scroll ne sont pas modifiés.
