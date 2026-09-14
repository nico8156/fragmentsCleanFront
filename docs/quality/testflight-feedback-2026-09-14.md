# Retour TestFlight 1.0.0 (3) — corrections UI et profil

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

### Profil et expériences

- retour natif rétabli dans les écrans enfants du profil ; l'accès « Tout voir »
  depuis le Home conserve désormais `ProfileHome` comme route initiale de la
  pile au lieu de construire une pile sans retour ;
- contraste du texte des boutons principaux corrigé : le texte opaque sombre
  remplace l'ancienne couleur à 30 % d'opacité sur le fond orange ;
- la préparation d'une photo possède son propre état et n'est plus bloquée par
  une autre commande profil en attente dans l'outbox ;
- autorisation explicite uniquement pour la caméra, avec accès direct aux
  réglages après refus. La photothèque utilise le sélecteur système et ne demande
  plus inutilement un accès global, conformément à Expo SDK 54 ;
- les représentations iPhone, notamment HEIC, sont converties en JPEG et
  redimensionnées à 1600 px maximum avant copie durable. La limite mobile est
  alignée sur les 8 000 000 octets du backend ;
- l'écran « Mes expériences » n'imbrique plus une grande carte de section autour
  des contenus. Chaque expérience utilise une carte compacte, un nom borné à
  deux lignes, un badge de statut non débordant, une photo plafonnée à 176
  points et des actions tactiles repliables sur plusieurs lignes ;
- suppression d'une photo ou d'une expérience protégée par une confirmation ;
- le profil courant est superposé dans les view models de ses commentaires et
  expériences déjà chargés. Cela donne un retour immédiat sans muter les read
  stores ; les projections backend restent alimentées par
  `app.user.profile_updated`. Un second appareil déjà ouvert ne reçoit pas
  encore d'invalidation SSE dédiée au profil : il voit la modification à sa
  prochaine lecture ou actualisation.

Modèle conseillé pour cette tranche transversale : **GPT-5.6 Sol High**.

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

Pour le profil, FlowAtlas a retrouvé `avatarAttachRequested` et un contexte
complet de 23 nœuds / 30 arêtes : listener, mise à jour optimiste, outbox,
watchdog et réconciliation. Le port `UserRepo` appelé par le dispatcher
polymorphe n'apparaît toutefois pas dans ce graphe alors qu'il est bien présent
dans le code ; ce point reste une limite utile à couvrir dans une prochaine
version de l'analyse Redux.

Tests écrits avant le correctif : bootstrap autorisé, absence de popup implicite,
émission par le processus de boot, reconnexion après isolation de compte,
bornes Home/sélection éditoriale, fermeture
native + état de la sheet, hauteur/réserve et centrage légal. Premier passage
rouge sur les nouveaux comportements, puis tests ciblés verts.

La première tranche a été validée avec **79 suites, 297 tests Jest verts** en
14,672 secondes. Les preuves finales de la tranche profil sont consignées lors
de sa clôture ci-dessous ; aucun contrat backend ou Studio n'est modifié.

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
8. Depuis le Home, ouvrir « Tes expériences » puis revenir avec la flèche native ;
   répéter depuis chaque entrée du profil.
9. Choisir une photo HEIC dans la photothèque puis une photo caméra : aperçu
   immédiat, état de synchronisation, avatar distant après relance.
10. Vérifier le nouveau nom et l'avatar sur un commentaire et une expérience
    existants, puis depuis un second compte après propagation backend.
11. Vérifier une liste d'au moins cinq expériences avec nom de café long,
    brouillon, synchronisation, photo et texte long ; toutes les actions doivent
    pouvoir défiler entièrement au-dessus de la floating tab bar.

## Validation de la tranche profil

- tests ciblés écrits avant le correctif : identité des commentaires,
  présentation des expériences, statuts de carte, HEIC vers JPEG durable et
  garde de navigation ;
- résultat ciblé : 5 suites / 12 tests verts ;
- résultat complet final : **83 suites / 305 tests Jest verts** en 16,73 secondes ;
  TypeScript vert ; dépendances Expo compatibles ; 8 contrôles de configuration
  release verts ; garde native et carte Redux à jour ;
- ESLint sans cache : 0 erreur, 18 avertissements préexistants. Le nouvel
  avertissement d'ordre d'import nécessaire au mock natif a été explicitement
  borné à la ligne concernée ;
- backend inchangé : 3 tests domaine/use case profil-avatar verts, puis verticale
  PostgreSQL/Testcontainers `UserProfileControllerIT` verte (6 tests, 0 échec),
  couvrant notamment upload, remplacement, lecture et suppression d'avatar ;
- `expo-image-manipulator ~14.0.8` est ajouté comme adaptateur natif compatible
  Expo SDK 54 ;
- la validation caméra/photothèque, la propagation entre deux comptes et le
  rendu final restent des critères de recette sur le prochain build signé, pas
  des preuves acquises sur le build `1.0.0 (3)`.
