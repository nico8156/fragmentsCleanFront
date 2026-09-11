# Home : composition de lectures

Le Home n'est pas un bounded context ni une source de vérité. Il compose les
lectures Redux déjà possédées par `articleWl`, `coffeeWl`, `entitlementWl` et
`experienceWl` dans `homeContentViewModel`.

- le hero éditorial et son bandeau de scroll restent la responsabilité de
  `MasterHeader` ;
- les cafés viennent du catalogue local et la géolocalisation ne fait que
  modifier le libellé et le tri déjà calculé par `coffeeWl` ;
- la prochaine étape est dérivée des entitlements serveur : seul un besoin de
  ticket propose le scan ;
- les expériences affichées sont celles de l'utilisateur, publiées et visibles ;
- aucune donnée fictive ne remplace une lecture absente : l'UI montre un état
  vide avec une destination explicite.

Cette composition reste read-only. Toute écriture conserve le flux écran →
view model → use case Redux → outbox.
