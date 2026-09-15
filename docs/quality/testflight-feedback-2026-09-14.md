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
- résultat complet final : **83 suites / 307 tests Jest verts** ;
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
- correctif de compatibilité après essai sur l'ancien binaire : le module natif
  est sondé via l'API optionnelle d'Expo puis chargé à la sélection uniquement
  s'il existe dans le binaire. Une recharge JavaScript ne fait donc plus planter
  toute l'application et la sélection ne tente plus de charger un module absent ;
  JPEG/PNG compatibles restent utilisables, tandis qu'un HEIC brut demande
  explicitement le nouveau build ;
- preuve dédiée du correctif de compatibilité : 1 suite / 3 tests verts (ancien
  binaire avec JPEG compatible, ancien binaire avec HEIC brut, nouveau binaire
  avec normalisation) ;
- la validation caméra/photothèque, la propagation entre deux comptes et le
  rendu final restent des critères de recette sur le prochain build signé, pas
  des preuves acquises sur le build `1.0.0 (3)`.

## Correctif média après recette appareil

La recette du 14 septembre a établi une cause commune aux avatars et photos
d'expérience : les objets avatar présents sous le préfixe S3 staging avaient
une taille de **0 octet**, et aucun objet d'expérience valide n'avait atteint
son préfixe. Le `File` Expo était envoyé par le `fetch` React Native global.

Le PUT signé passe désormais par `expo/fetch`, transport documenté par Expo SDK
54 pour envoyer directement un `File`. Le fichier durable local n'est plus
supprimé sur le seul succès HTTP de confirmation : il reste visible et
réessayable jusqu'au statut canonique de commande puis au remplacement par une
URL issue du read model serveur. La suppression locale passe par un port
technique injecté et borné au répertoire privé de l'application.

Les objets S3 vides observés n'ont pas été supprimés manuellement : le mécanisme
de nettoyage différé du backend reste propriétaire de leur cycle de vie.

La floating tab bar conserve sa géométrie et ses quatre destinations. Son blur,
son liseré lumineux et son ombre d'accent sont renforcés pour reprendre le relief
des contrôles de retour iOS sans modifier la navigation.

Validation source : 8 suites / 19 tests ciblés verts ; résultat complet final
**86 suites / 312 tests verts** ; TypeScript vert ; bundle Metro iOS généré ;
garde native et carte Redux à jour ; ESLint sans erreur (16 avertissements
préexistants). La preuve fonctionnelle restante est une nouvelle tentative sur
iPhone, dont l'objet S3 doit avoir une taille strictement positive avant
confirmation.

## Clavier — nom affiché et expériences


Retour complémentaire : le clavier masquait le nom affiché dans l'édition du
profil et la saisie des expériences. Correction de présentation uniquement :
`ProfileLayout` et la fiche café activent `automaticallyAdjustKeyboardInsets`.
L'implémentation iOS de React Native 0.81.5 installée ajuste les insets et le
défilement jusqu'au champ actif à partir du cadre réel du clavier. Le padding
clavier manuel de la fiche café est retiré sur iOS pour éviter le double espace.
Les boutons traitent le premier tap avec le clavier ouvert ; le glissement
permet sa fermeture interactive. L'édition d'une expérience donne le focus au
champ, dont la hauteur est bornée à 160 points avec défilement interne du texte.
Cela couvre « Mes expériences » et la création/modification depuis un café.

Les commandes, view models, ports et règles de synchronisation sont inchangés.
FlowAtlas n'est pas sollicité pour cette correction de layout sans parcours
Redux modifié. Aucun module natif supplémentaire n'est nécessaire.

Validation : TypeScript et ESLint ciblé verts ; 4 suites / 10 tests existants
verts (navigation profil, présentation des expériences et commandes profil /
expériences). Ces tests couvrent les régressions de parcours et de commandes,
pas la visibilité physique du champ au-dessus du clavier.

Recette iPhone à effectuer (géométrie du clavier non validable par Jest) :

- Profil → Modifier mon profil → Nom affiché : le champ remonte au-dessus du
  clavier ; faire défiler jusqu'à Enregistrer et vérifier qu'un seul tap agit.
- Mes expériences : modifier une carte en bas de liste, saisir un texte long,
  déplacer le curseur, puis enregistrer ou annuler sans être bloqué.
- Fiche café : créer puis modifier une expérience, avec et sans photo ; vérifier
  le champ actif et l'accès aux actions en faisant défiler la page.
- Fermer et rouvrir le clavier, revenir à l'écran précédent ; vérifier l'absence
  d'espace vide résiduel et le retour de la tab bar/actions flottantes.
- Refaire sur petit iPhone et avec grande taille de texte. Le simulateur iOS
  (`simctl`) n'est pas disponible dans l'environnement de cette intervention.

## Reconnexion, photos et contrat Experience — deuxième retour du 14 septembre

Diagnostic staging en lecture seule via SSM : les logs du conteneur Fragments
montrent plusieurs `HttpMessageNotReadableException` le 14 septembre entre
09:34 et 10:36 UTC. La cause est `Unrecognized field "kind"` sur
`CreateExperienceRequest` et `ExperienceCommandRequest`. Le champ interne de
l'outbox fuyait dans le JSON par sérialisation directe de la commande.
Le HTTP 400 précède donc l'exécution métier ; il ne justifie aucun rollback.
Les adaptateurs Experience construisent maintenant explicitement chaque corps
HTTP (création, édition, publication, suppression, signalement, suppression de
média). Les commandes existantes conservent leurs identifiants et peuvent être
réessayées. Aucun objet S3 ni commande locale n'a été purgé.

Après OAuth, le profil provisoire ne suffisait pas : le mobile relit désormais
le profil applicatif, même lorsque l'authentification fournit un résumé.
Un test fake-first reproduit l'avatar OAuth ancien puis vérifie son remplacement
par le dernier avatar du profil sans action supplémentaire de l'utilisateur.

Deux tests reproduisaient la disparition des photos : le snapshot de création
remplaçait une photo encore en cours d'upload ; une réponse plus ancienne pouvait
écraser une projection plus récente. Le merge conserve les médias locaux en
attente jusqu'à leur confirmation et ignore les versions antérieures. Le
nettoyage local vérifie aussi que le reducer a réellement remplacé le fichier.

Les URL privées S3 expirent indépendamment de la version du contenu. L'accueil
relit les expériences à chaque retour au premier plan de navigation ; l'article
relit son détail à chaque ouverture, même en présence du cache. Le contenu en
cache reste affiché pendant la requête et sur erreur réseau. Un test confirme
le renouvellement des URL d'article à version identique, puis leur conservation
si une lecture suivante échoue hors ligne. Cela ne garantit pas le téléchargement
hors ligne d'une image qui n'a jamais été mise en cache sur l'appareil.

Le bouton Google est centré verticalement dans ses 50 points. Le bouton Apple
n'est monté qu'après vérification de `isAvailableAsync` et de l'enregistrement
de sa vue native (métadonnées utilisées par Expo SDK 54). Ce dernier garde-fou
est dépendant de l'adaptateur Expo installé et devra être revu à sa mise à niveau.
Un ancien binaire de développement dépourvu de la vue exige un nouveau build de
développement pour utiliser Apple ; recharger Metro ne peut pas ajouter la vue
native. Le bouton officiel est conservé dans les binaires compatibles.

FlowAtlas a retrouvé `authSignInRequested` puis `authListenerFactory`. Le contexte
borné à 6 500 octets était explicitement incomplet (`maxBytes`) ; lecture ciblée
du listener nécessaire pour vérifier la branche qui sautait la récupération du
profil. Aucun scan Java générique lancé. Aucun changement backend ou AWS déployé.

Validation : suite complète finale de 86 suites / 322 tests verte. TypeScript, lint ciblé et
carte Redux vérifiés. Recette iPhone restante : reconnexion → dernier avatar,
reprise des commandes conservées → photo confirmée, réouverture d'un article
après expiration des liens, bouton Apple sur nouveau client natif et TestFlight.

## Suppression pendant synchronisation — captures de 14:28 à 14:30

Les captures montrent un badge tronqué, une expérience « Publiée » avec photo
encore en attente, un aperçu vide dans la fiche café et une barre d'actions
blanche sur fond sombre. La consultation filtrée des logs staging sur 90 minutes
n'a montré que des déconnexions SSE (`Broken pipe`), sans preuve de rejet de
suppression. Il ne faut pas attribuer ces déconnexions à un refus métier.

Trois problèmes mobiles sont corrigés et reproduits par tests :

- Une suppression locale pouvait être écrasée par une projection arrivée en
  retard, notamment après l'ACK d'une commande antérieure. Le marqueur DELETED
  persiste ; seul le rollback explicite de la suppression peut restaurer l'objet.
  Le rejet d'une ancienne modification ou d'un upload ne le restaure pas.
- Une commande reprogrammée après erreur réseau ne recevait pas de réveil à son
  échéance s'il n'y avait aucun ACK à vérifier. Le watchdog existant relance aussi
  les commandes queued éligibles, sous ses gardes session/connexion/boot.
- L'upload, la publication ou la suppression pouvaient dépasser la création
  reprogrammée. Les commandes d'une même expérience respectent désormais leur
  ordre d'enregistrement jusqu'au verdict canonique du prédécesseur. Une autre
  expérience peut continuer indépendamment.

Les tests verticaux fake-first couvrent création avec photo → erreur réseau →
reprise par ticks runtime → suppression → ACKs canoniques → outbox vide, sans
socket ni nouvelle action utilisateur. Deux cas sont couverts : suppression
avant la création confirmée et après échec d'upload. Après confirmation de la
création, la suppression passe avant les médias/éditions. Seul son statut APPLIED
permet de retirer les commandes devenues obsolètes, sans rollback ni purge des
fichiers locaux. Un upload impossible ne bloque donc plus la suppression. Cela ne
remplace pas la recette du binaire et du backend sur appareil.

Présentation : badge sous le nom du café, texte non tronqué ; tonalité pending
tant qu'un média attend ; aperçu photo partagé entre profil et fiche café,
hauteur de 176 points, message explicite en cas d'échec de lecture ; barre
d'actions accordée au thème sombre. Le placeholder ne répare pas un fichier
local réellement absent : cet éventuel cas reste à diagnostiquer sur appareil.

Validation finale : 87 suites / 325 tests verts, TypeScript et ESLint ciblé verts.
Carte Redux régénérée sans différence. FlowAtlas retrouve le listener depuis
`uiExperienceDeleteRequested` ; contexte borné explicitement incomplet à
3 000 octets, complété par lecture du reducer, de l'outbox et du watchdog.
Aucune suppression manuelle de données, aucun déploiement backend/AWS.
Correctif JavaScript uniquement : recharger le client de développement suffit.

Recette restante : supprimer une expérience synchronisée puis une expérience
avec photo encore en attente ; parcourir accueil/profil/café pendant les ACKs ;
vérifier qu'elle ne réapparaît pas, puis redémarrer l'app. Tester également une
perte/reprise réseau et contrôler le rendu des badges et aperçus sur petit écran.

### Complément Apple pendant cette passe

Le premier garde-fou du bouton dépendait uniquement des métadonnées natives
legacy et pouvait donc masquer une vue disponible. Il utilise maintenant en
priorité `expo.getViewConfig`, comme l'adaptateur natif Expo SDK 54 installé,
avec repli legacy uniquement si cette API est absente. Trois tests couvrent vue
JSI présente sans legacy, vue absente malgré ancien metadata et fallback legacy.
Si le binaire ne contient réellement pas le composant, un build reste nécessaire.
L'identité exacte du client utilisé par l'utilisateur reste à confirmer.

Avatar Apple : parcours identique à Google après authentification. Vérification
de `useAuthUser.replaceAvatar`, `profileUpdateListenerFactory`, `HttpUserRepo`,
`WriteAvatarController` et `ConfirmAvatarCommandHandler`. Le backend autorise par
JWT Fragments et propriété du média, sans condition sur le fournisseur OAuth.
`CompleteAppleLogin` retrouve l'identité par fournisseur + identifiant Apple et
renvoie un avatar null ; la relecture `/api/users/me` récupère l'avatar applicatif.
`AuthUserCreatedEventHandler` ne recrée pas un profil existant. L'événement
`app.user.profile_updated` alimente les projections Social et Experience.
Les tests de connexion/récupération d'avatar et d'enqueue/confirmation de photo
sont maintenant paramétrés Google + Apple. Ce sont des preuves locales ; le
parcours Apple natif sur appareil reste à valider. Aucun rapprochement automatique
des comptes Google/Apple n'est introduit.

Après les compléments Apple et suppression prioritaire : **88 suites / 331 tests
verts**, TypeScript et lint ciblé verts. Aucun test natif sur iPhone exécuté par
l'agent ; la validation visuelle et le login Apple réel restent à effectuer.

## Suppression qui réapparaît, photos anciennes sur Home et tags éditoriaux

Cette nouvelle investigation apporte une preuve absente de la passe précédente :
lecture seule des reçus `command_status`, derniers deletes à 12:34, 12:58 et
13:02 UTC le 14 septembre, statut REJECTED et code `EXPERIENCE_NOT_FOUND`.
La recherche initiale par `Experience` n'avait rien trouvé car les types sont
en minuscules (`experience.delete.v1`). La comparaison des identifiants et
statuts entre `experience_views` et `experiences` montre deux expériences
publiées, présentes des deux côtés. Aucun contenu ni fichier photo consulté.
Le flash observé est compatible avec le rollback d'une suppression explicitement
refusée pour absence, qui restaurait son ancien snapshot local.

Correction : transmettre le code métier structuré au rollback, depuis le HTTP
422 comme depuis `/commands/{commandId}`. Pour un delete explicitement refusé
avec `EXPERIENCE_NOT_FOUND`, supprimer la représentation locale obsolète au lieu
de la restaurer. Le reçu reste REJECTED, aucune réussite serveur inventée.
Les autres refus conservent leur rollback, et aucune erreur de transport ne
justifie cette suppression locale. Les tests verticaux couvrent les deux chemins,
avec un contrôle négatif de refus de propriété. Aucun changement backend requis.

Photos : Home utilisait encore `Image` React Native alors que le profil utilisait
`expo-image`, donc des caches distincts. Les expériences utilisent désormais
`ExperiencePhoto` sur les trois surfaces (Home, profil et café), et une clé de
cache distante stable par mediaId. Les URLs S3 restent privées et temporaires,
renouvelées par les lectures existantes ; changer la signature ne crée plus une
nouvelle identité de cache. Les previews locales ne partagent pas cette clé
distante. Le format Home reste compact (108 points), les fiches à 176 points.
Un test vérifie le transport de l'URI et de l'identifiant pour photo locale récente
et photo distante ancienne. La différence de cache est établie dans le code ;
la cause de chaque photo manquante sur appareil n'est pas prouvée. Un fichier
local absent ou un objet distant manquant n'est pas réparé par ce correctif.

Tags du grand visuel Home : Origines/Qualité/Terroir jade ; Bien-être/Nutrition/
Science lavande ; Culture/Durabilité/Producteurs ocre ; Maison/Recettes/Équipement
corail ; Découverte/Torréfacteurs/Communauté bleu doux. Les autres tags reçoivent
une couleur stable de la même palette, indépendante de leur position. Casse et
accents normalisés pour le choix de couleur. Texte brun très sombre, contraste
calculé minimum 7,32:1 sur les cinq fonds opaques. Grand visuel, géométrie et effet
du bandeau au scroll inchangés.

FlowAtlas : contexte `experienceRollback` retourne le lien vers le reducer mais
pas les appelants du helper `rollbackRejectedOutboxRecord`. `complete: true`
décrit ici le graphe connu, pas l'exhaustivité du chemin métier ; lecture ciblée
du processor et du watchdog nécessaire pour transmettre le motif de rejet.

Validation : suite complète 88 suites / 334 tests verte, puis deux contrôles
négatifs supplémentaires validés dans la suite verticale ciblée. TypeScript,
lint ciblé et carte Redux vérifiés. Vérification iPhone restante : supprimer un
ancien élément absent du serveur, comparer une même photo ancienne entre profil
et Home après rechargement, puis apprécier les couleurs de tags sur les photos.
Correctifs JavaScript uniquement ; aucun déploiement ni purge distante effectués.
