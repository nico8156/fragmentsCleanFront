# Retour TestFlight 1.0.0 (3) — première correction UI

Date : 14 septembre 2026. Périmètre mobile uniquement. Aucun changement backend,
AWS, EAS, données ou chantier de conservation/restauration.

## Retours traités

### Connexion

- liens « Politique de confidentialité » et « Conditions d'utilisation » centrés ;
- texte légal et liens regroupés dans un bloc bas cohérent ;
- bouton Google aligné sur la hauteur de 50 points du bouton Apple et graisse
  ramenée à 600. Le bouton Apple reste le composant natif officiel : sa police
  interne n'est pas remplacée.

### Home

- aucune modification de `MasterHeader`, du grand visuel ou de son bandeau au
  scroll ;
- cinq cafés maximum dans un rail horizontal de cartes compactes ;
- trois expériences visibles maximum dans un rail horizontal plus petit, avec
  placeholder sobre lorsqu'une photo manque ;
- articles suivants laissés en liste verticale. Règle explicite : ordre renvoyé
  par le backend, cinq premiers dans le hero, puis trois premiers identifiants
  non présents dans le hero. Pas de recommandation algorithmique en V1.

### Carte

- le bootstrap demande une position courante lorsque la permission foreground
  est déjà accordée, sans présenter de popup au démarrage ;
- si la carte est déjà montée, la première position réelle remplace le fallback
  Paris. Le bouton suit aussi la lecture fraîche après un seul appui ;
- avant cette position, un catalogue déjà chargé centre la carte sur son premier
  café plutôt que sur Paris ; Paris ne subsiste que comme dernier fallback
  technique lorsqu'il n'existe encore ni position ni café ;
- une connexion après l'écran d'authentification déclenche de nouveau cette
  lecture autorisée, car l'isolation du compte réinitialise l'état local ;
- aperçu café porté de 40 % à 58 % et réserve basse égale à la floating tab bar ;
- toucher la carte appelle explicitement `close()` sur la sheet et remet son
  état React à `-1`, ce qui replie la sheet avec le flou ;
- contenu du marqueur et libellé centrés dans un conteneur commun.

## Architecture et preuves

Le bootstrap émet une intention `locationBootstrapRequested`; le listener du
contexte `locationWl` reste propriétaire de la permission et de l'appel au port
Expo. La screen ne contacte pas Expo Location. Les rails Home ne changent que la
présentation d'un read model existant. Aucun seuil Pass ou invariant métier n'est
dupliqué dans les composants.

FlowAtlas TypeScript a retrouvé l'événement `userLocationRequested` et son
contexte complet (10 nœuds, 16 arêtes), notamment listener, événements dérivés
et reducer. Il a confirmé rapidement la frontière Redux, mais n'a pas remonté
l'appel depuis le callback du view model dans ce contexte ; la recherche texte
ciblée a donc été nécessaire pour prouver l'absence de dispatch au bootstrap.

Tests écrits avant le correctif : bootstrap autorisé, absence de popup implicite,
émission par le processus de boot, reconnexion après isolation de compte,
bornes Home/sélection éditoriale, fermeture
native + état de la sheet, hauteur/réserve et centrage légal. Premier passage
rouge sur les nouveaux comportements, puis tests ciblés verts.

Validation finale de cette tranche : **79 suites, 297 tests Jest verts** en
14,672 secondes ; TypeScript vert ; 8 contrôles de configuration release verts ;
garde native et carte Redux à jour. ESLint : 0 erreur, 18 avertissements
préexistants (20 avant la tranche, deux imports inutilisés supprimés dans le test
localisation touché). `git diff --check` vert. Aucun test Java/Studio nécessaire :
leurs sources et contrats ne changent pas.

Ces preuves sont des tests source. La capture jointe appartient au build
TestFlight `1.0.0 (3)` antérieur au correctif. Navigation, dimensions de sheet,
position GPS et rendu des rails nécessitent un **nouveau build signé** et la
recette sur appareil ci-dessous ; ils ne sont pas annoncés comme déjà validés
sur iPhone.

## Recette attendue sur le prochain build

1. Ouvrir l'app avec la localisation déjà autorisée, puis la carte : Rennes doit
   remplacer Paris sans toucher le bouton.
2. Révoquer/réinstaller : aucun popup de localisation sur le seul écran de
   connexion ; la demande apparaît lors d'une intention explicite.
3. Avec coordonnées absentes, toucher une fois la cible : la carte doit se
   recentrer dès réception de la position.
4. Sélectionner un café : « Voir la fiche » doit rester au-dessus de la tab bar.
5. Toucher la carte hors sheet : flou et sheet doivent disparaître ensemble.
6. Vérifier centrage des noms courts et longs de marqueurs.
7. Vérifier rails Home avec 1, 3 et 5 cafés, puis plusieurs expériences, petits
   et grands iPhone, VoiceOver et tailles de texte augmentées.
