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
- « À lire ensuite » conserve une liste verticale. Les cinq premiers articles
  de l'ordre éditorial renvoyé par le backend alimentent le hero ; les trois
  premiers articles suivants, après exclusion de ces identifiants, alimentent
  cette rubrique. Il n'existe pas encore de recommandation personnalisée ou
  algorithmique ;
- aucune donnée fictive ne remplace une lecture absente : l'UI montre un état
  vide avec une destination explicite.

Cette composition reste read-only. Toute écriture conserve le flux écran →
view model → use case Redux → outbox.

Le grand visuel `MasterHeader` et l'apparition du bandeau au scroll ne sont pas
modifiés par les rails horizontaux.
