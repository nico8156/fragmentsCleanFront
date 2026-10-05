# Fiche café — présentation du lieu

5 octobre 2026. Suite à la stabilisation PR1, périmètre limité à `features/cafes` et à ses tests de présentation. Référence : [audit Fragments Design 2026](fragments_design_2026_audit.md), section 5.

## Composition retenue

- Header sans panneau : nom complet sur plusieurs lignes, retour 44 points, statut textuel discret. J’aime/commentaires restent secondaires ; leurs retours pending/acked/failed restent affichés.
- Photo avant les actions, sans titre ni double cadre, ratio 4:3 adapté à la largeur. Cache natif `memory-disk` conservé. Une absence de photo devient une ligne calme plutôt qu’un grand emplacement vide.
- Itinéraire primaire, favori/appel/partage en contrôles secondaires de 44 points minimum. Appel indisponible sans numéro ; favori en attente désactivé avec indicateur. Mêmes callbacks et destinations natives.
- Expériences avant caractéristiques et informations pratiques, texte plus lisible, cards sans bordure englobante supplémentaire. États chargement/erreur/vide et retours de synchronisation inchangés.
- « Raconter ma visite » déplie le formulaire. Le replier conserve sa saisie et sa photo locale, sans lancer de commande. Le contenu masqué reste monté mais sort de l’accessibilité ; replier ferme le clavier. Brouillon/publication utilisent les boutons PR1 et les callbacks existants.
- Informations pratiques sans sous-cards ; semaine accessible via les horaires repliables. Commentaires après les informations essentielles, avec états de transport et actions existants.

## Clearance et compromis

`CafeDetails` est une route du stack racine, hors des onglets : aucune tab bar n’est ajoutée. La fiche utilise `ScrollClearance floatingTab={false}` et le padding final PR1. La barre d’actions sticky en doublon est retirée ; elle superposait ses commandes au contenu. Toutes les actions restent dans le flux, avec safe area basse réservée hors viewport. Le clavier conserve les ajustements et callbacks de visibilité existants.

Compromis : itinéraire/favori/appel/partage demandent de remonter vers la photo depuis le bas de la fiche. Le header garde le retour et le raccourci commentaires. Le nom complet peut augmenter sa hauteur ; la compacité ne repose pas sur une troncature. Les icônes secondaires ont des labels d’accessibilité ; sur une plateforme sans symbole, leur libellé sert de fallback.

Le repli est local à l’écran, sans persistance nouvelle. Aucune modification des view models, contrats backend, Redux, outbox, Pass, sélection de données ou politique de cache. Aucun fetch ni mapping DTO ajouté aux screens. La gestion native des photos déjà présente dans le composant reste inchangée.

## Vérifications

Itération **CHORE visuel / refactoring de présentation**, route **Read Feature**. Le seul état ajouté est l’ouverture visuelle du formulaire. Aucun nouveau comportement métier, pas de RED métier artificiel ni de mutation métier applicable.

- Référence verte avant retouche : `coffeePresentation` et `releaseAccessibilityGuardrail`, **2 suites / 4 tests**.
- Tests ciblés après retouche : `cafeDetailPresentation`, `coffeePresentation`, `releaseAccessibilityGuardrail`, **3 suites / 12 tests PASS**.
- Les nouveaux tests couvrent repli/saisie conservée/accessibilité, titre complet, trois états de synchronisation, callbacks header, favori pending, appel indisponible, partage/appel natifs, photo vide/cache/largeur étroite et ouverture des horaires.
- Mocks limités aux vues et API natives, aucun view model ou port métier mocké.
- Suite complète `npx jest --watchman=false --runInBand` : **97 suites / 387 tests PASS**, incluant les protections offline, outbox, commentaires et expériences.
- `git diff --check` : **PASS**.
- `npm run typecheck` et `npm run lint` : **PASS**.
- Limite : les tests de renderer ne prouvent pas le rendu UIKit, les gestes ou la visibilité au-dessus du clavier.

## Captures et recette iPhone

Avant réel : [header/photo/formulaire](../../assets/screens_fragments_design/IMG_5424.PNG). Cette capture est conservée sans retouche. Les captures `screens_PR1` concernent Home/carte/preview et ne constituent pas une preuve après pour cette fiche. La capture native locale reste indisponible faute de Xcode ; après iPhone **à fournir/valider**.

À capturer et vérifier :

- Nom long Bourbon : nom complet, statut discret, photo et actions au premier écran ; grande police et petit écran.
- Expériences avec/sans contenu ; ouvrir, saisir, replier et rouvrir le formulaire ; photo sélectionnée conservée.
- Bas de fiche : horaires ouverts, dernier commentaire et bouton envoyer accessibles ; ouverture/fermeture du clavier.
- Cache hors ligne : lecture conservée, pending favori/expérience/photo/commentaire visible, sans changer la politique de retry.
- Carte → fiche → retour : région et sélection préservées ; statut système lisible.

Verdict : **REVIEW**, contrôles automatiques disponibles ci-dessus ; rendu après et interactions iPhone restent à valider.

## Micro-corrections avant validation

Structure conservée. Marge basse du header réduite de 8 à 4 points pour rapprocher le statut de la photo. Les actions auteur des commentaires deviennent des liens sans fond/bordure, en graisse 400 ; « Supprimer » conserve sa couleur sémantique. Les cibles restent hautes d’au moins 44 points et passent à la ligne si nécessaire. La rangée de métriques du header peut rétrécir et se répartir sur plusieurs lignes.

Revue de code nom long / grande police / petit écran : titre sans limite de lignes, sans hauteur fixe ni réduction imposée de la police ; métriques et actions repliables sur plusieurs lignes ; photos mesurées à la largeur disponible. Tests renderer : titre long et photo en largeur 220 points couverts. **La combinaison réelle Dynamic Type + petit écran n’est pas validée sur UIKit.**

Contrôles exécutés après ces micro-corrections : **3 suites / 12 tests PASS**, TypeScript **PASS**, lint des deux composants **PASS**. Pas de nouveau test miroir de styles pour ces retouches visuelles.

Captures iPhone demandées, toujours **NOT RUN** : haut de fiche ; expérience repliée ; expérience ouverte ; bas avec horaires/commentaires ; bas avec clavier. Environnement revérifié : `xcode-select -p` indique CommandLineTools, `xcrun simctl` est indisponible, Xcode absent de `/Applications` et aucun outil de capture d’iPhone installé. Aucune capture web ou maquette ne remplace cette preuve native. La validation attend les captures réelles de l’appareil.


### Captures reçues après la demande

Le lot `assets/screens_PR2` est désormais disponible et inspecté : voir la [revue des 20 captures](experiences-media-contribution.md#revue-des-captures-screens_pr2). [IMG_5460](../../assets/screens_PR2/IMG_5460.PNG) confirme le nom long Bourbon sur deux lignes, le statut discret et la photo valorisée. Le formulaire ouvert/replié, les informations et les commentaires sont photographiés, mais leur présentation est antérieure aux dernières retouches. Aucun clavier, aucune semaine d’horaires dépliée ni réglage de grande police attesté. Le verdict demeure REVIEW pour ces points et pour les corrections les plus récentes.
