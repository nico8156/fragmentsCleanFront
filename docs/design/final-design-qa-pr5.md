# PR5 — QA finale design iPhone

5 octobre 2026. CHORE visuel, route présentation/read ; petite extraction de rendu. PR1–PR4 restent validées dans leur direction. Aucun nouveau parcours ni refonte.

## Corrections de cette passe

- **Tab bar réellement flottante** : `ScrollClearance` ne raccourcit plus le viewport des routes avec onglets. Son callback fournit la réserve commune à ajouter au `contentContainerStyle`. Home, liste cafés, Pass et `ProfileLayout` (Profil, Mes expériences, Favoris, Tickets, Paramètres, édition) la consomment. Aucun fond ajouté au wrapper, aucun rectangle opaque fixe derrière le verre.
- La sheet carte garde son padding de fin et perd son footer opaque fixe. Son fond de sheet et les dimensions de la tab bar restent inchangés.
- Le blur, la teinte translucide et le mode « Réduire la transparence » restent ceux de la tab bar existante, limités à sa capsule. Aucun dégradé ajouté.
- Fiche café : les états chargement et identifiant invalide utilisent le header compact partagé, avec retour 44 pt et contenu scrollable. La fiche est une route racine **hors tab bar** : sa réserve reste limitée à la safe area.
- Mes expériences : `MyExperiencesReadState` rend le premier chargement explicite et distingue erreur initiale, erreur avec données conservées et liste vide. Le callback de réessai existant est conservé.

### Clearance et compromis

Avec une safe area de 34 pt, la réserve commune vaut 126 pt : barre 70 + inset 34 + décalage 10 + respiration 12. Home, liste et layout Profil ajoutent leurs 16 pt de respiration existants : 142 pt de padding final. Pass conserve aussi l'espacement propre à son contenu.

En cours de défilement, du contenu peut passer derrière le blur ; en fin de défilement, le dernier contrôle remonte intégralement au-dessus. C'est le comportement flottant demandé. La zone vide de fin appartient au contenu défilant, pas à une couche opaque fixe. Aucun changement de gestion du clavier ; la barre reste masquée lorsqu'il est visible. Le rendu clavier/rotation/grandes polices nécessite encore un contrôle natif après cette correction.

## Écrans audités

Audit de composition/code et tests de rendu, distinct d'une exécution native PR5.

| Écran | Clearance / header | États et actions |
| --- | --- | --- |
| Home | viewport complet, padding partagé, contrôles 44 pt | sections et états existants conservés, limites 5 cafés / 3 expériences inchangées |
| Liste cafés | FlatList plein viewport, padding partagé, bascule carte 44 pt | recherche, filtres, noms sur deux lignes, vide et états existants conservés |
| Carte / preview | réserve en fin de BottomSheetScrollView, footer fixe retiré | preview compact, actions indisponibles pendant chargement |
| Fiche café | hors onglets, safe area seulement, retour compact y compris chargement/erreur | contribution, infos, commentaires et gestion du clavier conservés |
| Mes expériences | layout Profil commun | chargement/vide/erreur clarifiés ; statuts et pending média hors Options ; Publier visible ; confirmations existantes conservées |
| Profil / Favoris | layout commun et header compact | identité/fallback, données enregistrées, vide, erreur/réessai et pending existants |
| Tickets | layout commun | contenu, vide, erreur/réessai, pagination existante |
| Pass | padding commun, safe area haute sans double inset bas | actif et attente de synchronisation ; aucun nouvel état métier inventé |
| Paramètres / édition profil | layout commun, contrôles de retour 44 pt | actions compte et confirmations inchangées |
| Articles / scan / badges | routes secondaires auditées, hors onglets | chargement, erreur, permission/photo selon les états déjà exposés |

Les tests de rendu couvrent les cibles tactiles, labels, textes/statuts, Options et confirmations existantes. Ils ne prouvent ni le compositing UIKit, ni VoiceOver, ni la position mesurée sur un iPhone.

## Captures natives disponibles

Les originaux utilisateur restent dans `assets/screens_PR1` à `screens_PR4`. **Aucune nouvelle capture native PR5 n'a pu être produite ici** : `xcrun simctl list devices` échoue (« unable to find utility simctl »). Les captures ci-dessous précèdent la correction du fond bas et ne sont pas présentées comme des preuves après correction.

| Scénario | Capture reçue | Limite |
| --- | --- | --- |
| Home | [PR1 — Home](../../assets/screens_PR1/IMG_5444.PNG) | historique, avant les dernières retouches PR1 |
| Liste cafés haut | [PR4 — liste](../../assets/screens_PR4/IMG_5487.PNG) | avant correction PR5 du viewport |
| Liste cafés scroll | [PR4 — liste défilée](../../assets/screens_PR4/IMG_5488.PNG) | pas la fin réelle ; fin validée oralement par l'utilisateur avant PR5 |
| Carte et sheet | [PR1 — carte](../../assets/screens_PR1/IMG_5448.PNG) | historique |
| Fiche café haut / bas | [haut](../../assets/screens_PR2/IMG_5460.PNG), [bas](../../assets/screens_PR2/IMG_5462.PNG) | avant les derniers ajustements PR2 |
| Expérience publiée / Options fermé | [PR4 — publiée](../../assets/screens_PR4/IMG_5489.PNG) | composition validée, fond bas antérieur |
| Options ouvert | [PR4 — Options](../../assets/screens_PR4/IMG_5490.PNG) | preuve du menu, pas de fin de liste |
| Pending média | [PR2 — pending](../../assets/screens_PR2/IMG_5468.PNG) | avant regroupement final des actions sous Options |
| Profil | [PR3 — profil](../../assets/screens_PR3/IMG_5477.PNG) | antérieur à PR5 |
| Favoris avec contenu | [PR3 — favoris](../../assets/screens_PR3/IMG_5480.PNG) | ancien retour natif, remplacé depuis |
| Tickets | [PR3 — tickets](../../assets/screens_PR3/IMG_5481.PNG) | avant présentation PR4 |
| Pass haut et bas | [PR4 — Pass](../../assets/screens_PR4/IMG_5486.PNG) | les quatre niveaux sont visibles ; avant correction PR5 |

Pour fermer la preuve PR5 : reprendre la courte série demandée après correction, notamment fin réelle liste cafés/Mes expériences, brouillon explicitement marqué avec Publier, pending avec Options fermé, Tickets actuel, erreur/réessai et grande police/petit écran. Les validations utilisateur PR3 et PR4 restent acquises ; elles ne remplacent pas une preuve native du nouveau viewport.

## Vérification

- Baseline présentation café/expériences/profil avant corrections : 3 suites, 28 tests passés.
- Ciblés PR5 (`finalDesignStates`, `designPrimitives`, `coffeeDiscoveryPresentation`, `profilePresentation`, `passTicketsPresentation`) : 5 suites, 48 tests passés. Vérifient notamment viewport sans marge fixe, padding final, absence de footer opaque, safe area hors onglets et nouveaux états de lecture.
- `npx jest --watchman=false --runInBand` : **104 suites, 439 tests passés**.
- `npm run typecheck` : passé.
- `npm run lint` : passé.
- `git diff --check` : passé.
- Logs locaux : `/tmp/fragments-pr5-targeted.log`, `/tmp/fragments-pr5-full.log`, `/tmp/fragments-pr5-typecheck.log`, `/tmp/fragments-pr5-lint.log`.
- Mocks des nouveaux tests limités aux frontières natives/rendu. Pas de mock de view model ni de port métier.
- Mutation testing : non applicable, corrections de présentation uniquement.

## Périmètre préservé et verdict

Aucun changement PR5 backend, Redux métier, DTO, fetch, contrats, navigation produit, outbox/offline/cache ou invariants Pass. Les autres modifications déjà présentes dans le workspace appartiennent aux passes précédentes et sont conservées.

**REVIEW natif proposé** : implémentation et tests de rendu disponibles ; GO release design suspendu à la preuve iPhone après correction de l'effet flottant. Aucun déploiement/TestFlight effectué.

## Harmonisation des headers racine — complément PR5

La transparence de la tab bar après correction est **validée par l'utilisateur**.
Profil affiche désormais un seul grand titre « Profil », aligné à gauche avec
le token `typography.screen` (26/32, graisse 600), identique au titre Pass.
Le header centré est désactivé uniquement sur `ProfileHome`. La safe area haute
est prise en charge par le contenu racine, sans ajouter d'inset bas.
Avatar, identité et accès édition restent dans le contenu existant.

Mes expériences, Mes favoris, Mes tickets, Paramètres, Modifier mon profil
et Fiche café conservent leur header compact et leur retour. Home conserve
son header de découverte et Carte ses contrôles ; leurs surfaces, espacements,
contrôles et tab bar restent ceux du système partagé. Aucun changement métier.

Cette retouche reste à confirmer visuellement sur iPhone ; aucune nouvelle
capture native produite ici.

Vérification de ce complément : 3 suites ciblées Profil/navigation/Pass,
27 tests passés ; `npm run typecheck`, `npm run lint` et `git diff --check`
passés. La suite complète précédente (439 tests) reste la baseline PR5 ;
elle n'a pas été relancée pour cette retouche limitée au header racine.

Complément typographie : l'utilisateur constate encore une différence native
Profil/Pass. Les deux styles déclaraient déjà 26/32, graisse 600 ; cela ne
suffisait donc pas à expliquer la perception native. Ils utilisent désormais
le même composant `RootScreenTitle`, sans styles locaux de titre : même Text,
taille, interligne, graisse, alignement et comportement de mise à l'échelle.
27 tests ciblés passés, typecheck/lint/diff-check passés. La résolution du rendu
perçu reste à confirmer sur iPhone, aucune preuve native produite ici.

## Captures PR5 reçues — Profil et Pass

Deux captures utilisateur examinées dans `assets/screens_PR5` :
- [Pass](<../../assets/screens_PR5/Capture d’écran 2026-10-05 à 14.20.19.png>)
- [Profil](<../../assets/screens_PR5/Capture d’écran 2026-10-05 à 14.20.21-2.png>)

Les tailles apparentes des titres sont cohérentes sur ces deux rendus.
Un écart de position verticale reste visible : Profil commence environ 8 pt
plus bas. Correction limitée : padding haut du layout racine Profil passé
de 16 à 8 pt, comme Pass ; les sous-écrans restent à 16 pt.
Les captures précèdent cette dernière correction de marge. La tab bar apparaît
flottante, sans bande fixe distincte ; les derniers éléments visibles sur ces
deux écrans sont dégagés. Ces captures ne prouvent pas les autres scénarios PR5.

Vérification marge haute : 18 tests ciblés passent ; typecheck, lint et
`git diff --check` passent.
