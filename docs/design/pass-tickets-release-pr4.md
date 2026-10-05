# PR4 — Pass, tickets, découverte et polish release

5 octobre 2026. PR1, PR2 et PR3 validées par l’utilisateur ; PR3 clôturée, scénarios restants compris. Verdict proposé PR4 : **REVIEW visuel iPhone**.

**Validation utilisateur complémentaire : clearance de la liste cafés validée en fin réelle de scroll.** L’utilisateur confirme que le menu ne gêne pas le contenu. Ce point est clos sans modification de `ScrollClearance` ni de la tab bar. Les autres états de la checklist ne sont pas implicitement validés par cette confirmation.

## Classification et périmètre

`CHORE` visuel avec extractions `REFACTORING` de présentation, route mobile Read Feature / UI. Baseline verte, sans RED métier artificiel. L’addendum utilisateur inclut la liste des cafés, sa recherche, ses filtres et la bascule vers la carte.

## Changements

- **Pass** : titre et explication courts, hiérarchie plus calme, objectifs sans double bordure, niveaux répartis sur deux colonnes avec noms non tronqués et statuts français visibles. Avatar et anneaux Pass partagés conservés. `ScrollClearance` remplace le padding fixe ; safe area supérieure et latérale seulement, pour ne pas compter deux fois l’inset inférieur.
- **Tickets** : suppression de l’identité répétée en haut de l’historique, cards moins encadrées, statuts sur surfaces sombres, montants et dates conservés. Archives avec noms complets, disclosure accessible et chargement de la suite inchangé. Chargement initial explicite, état vide calme, lecture initiale en échec distinguée d’une liste réellement vide, données conservées visibles en cas d’erreur. Réessai et pagination ont une cible d’au moins 44 points.
- **Scan et confirmation** : surfaces sombres, couleurs sémantiques lisibles, boutons de 44 points minimum, statuts photo textuels et erreur de permission conservés. Confirmation défilante avec safe area et boutons partagés. Aucun changement de capture, OCR, permission, soumission ou navigation après soumission.
- **Badges** : détail désormais défilant, sections plus sobres, critères flexibles, labels accessibles sur les cartes de niveaux. Le header possède l’inset supérieur, les contenus conservent les insets latéraux et inférieur.
- **Headers** : extraction du header validé en PR3 vers `ScreenHeader`, avec alias `ProfileHeader` conservé. Réutilisation limitée aux routes BadgeDetail, AllBadges et ScanTicketModal. Aucun remplacement du header des fiches café, Home ou carte.
- **Recherche secondaire** : retour et effacement nommés pour l’accessibilité, effacement porté à 44 points, safe area via le composant partagé de l’application. Algorithme, seuil de recherche et navigation inchangés.

## Addendum — Tous les cafés

Références avant correction examinées : [IMG_5484](../../assets/screens_PR3_rel/IMG_5484.PNG) et [IMG_5485](../../assets/screens_PR3_rel/IMG_5485.PNG).

- `#google-places` devient **Référencés sur Google**. Il s’agit uniquement du texte visible et du label accessible : la clé `google-places`, la sélection et le callback restent identiques. Un filtre déjà sélectionné peut donc toujours être désactivé.
- `CoffeeListCard` affiche le nom sur deux lignes, l’adresse courte, la ville, le statut textuel et la distance existante. Le label accessible conserve le nom complet. Si le view model retourne un horaire inconnu, le texte devient « Horaires à confirmer » ; aucun calcul d’ouverture supplémentaire.
- Vignette stable de 88 points au ratio 4:3, cache image `memory-disk` conservé. Sans photo, emplacement neutre avec label « Photo indisponible ». Suppression du fond massif, des ombres et des cadres répétés.
- Filtres et tri plus sobres, contrôles nommés, états sélectionnés accessibles. Les deux switches restent visibles ; la recherche reçoit exactement les mêmes callbacks.
- Header et filtres placés dans le header de la FlatList : ils défilent pour libérer de la hauteur sur petit écran. Le bouton **Afficher la carte** mesure 44 × 44 points et reste accessible en haut de liste. Aucun nouveau mode carte/liste.
- La liste conserve `ScrollClearance`, avec padding après le dernier café. Ajustement clavier automatique et taps transmis aux contrôles. L’état vide propose d’ajuster recherche ou filtres ; le message de données conservées ne parle plus de « cache local ».

## Composants extraits

`PassContent`, `TicketsContent`, `ScanTicketContent`, `ScanTicketSuccessContent`, `ScreenHeader`, `CoffeeListCard` et `CoffeeListHeader`. Les screens conservent leurs hooks et callbacks existants ; les composants de contenu reçoivent des props de présentation. Les tests ne mockent aucun view model ni port métier.

## Clearance et limites des états disponibles

| Routes | Traitement |
| --- | --- |
| Home | `ScrollClearance` PR1 conservé |
| Carte | Géométrie PR1 des contrôles et preview conservée |
| Tous les cafés | `ScrollClearance` autour de toute la liste, header et filtres compris |
| Pass | Migration vers `ScrollClearance`, aucun inset inférieur dupliqué |
| Profil et ses enfants, dont Tickets | `ProfileLayout` / `ScrollClearance` PR3 conservés |
| Badges, scan, recherche, confirmation | Routes hors tab bar : safe area seule ; scan via `ScrollClearance floatingTab={false}` |

Le view model Pass ne fournit ni erreur réseau ni callback de réessai : absence de snapshot et absence de critères restent représentées par l’attente de synchronisation existante. Aucun état « actif » ou « indisponible » métier inventé, aucun seuil local. Aucun nouvel accès scan/tickets ajouté au Pass, qui n’exposait pas ces callbacks.

Le view model de découverte expose le repli sur les cafés enregistrés, mais pas le chargement initial ni une erreur initiale séparée. Ces états ne sont pas inventés dans les screens. Les erreurs et chargements existants des tickets et du scan sont conservés.

Le header custom évite la capsule système et autorise un titre sur plusieurs lignes ; le menu natif du bouton retour n’est pas reproduit. Le header de la modale scan, le clavier et Dynamic Type nécessitent particulièrement une vérification native.

## Hors périmètre

Aucun changement backend, DTO, Redux métier, view model, gateway, outbox/offline/cache ou invariants Pass. Pas de nouveau fetch dans les screens. Pas de Wallet, QR, paiement, règle de validation, upload, tri ou moteur de recherche ajouté. Les calculs Pass, l’état des horaires et les statuts tickets restent issus des sources existantes. Les confirmations destructives PR2/PR3 sont inchangées.

## Vérifications

- Baseline avant extraction : présentation profil et view models Pass/tickets, **3 suites / 15 tests PASS**.
- Premier contrôle ciblé Pass/tickets/profil/accessibilité et view models : **6 suites / 33 tests PASS**, puis ajout d’un test du vrai PassScreen avec son store pour la clearance.
- Addendum découverte : **2 suites / 9 tests PASS**, incluant les sélecteurs de recherche/tri existants et le vrai parcours de liste avec store.
- Tests de présentation : état Pass en attente, progression et niveau atteint ; tickets pleins/vides/chargement/erreur/données conservées/archives/pagination ; permissions et traitement photo ; callbacks de confirmation ; retour compact ; clearance ; noms longs, image/absence d’image, ouvert/fermé/inconnu, filtres, recherche, ouverture de fiche et carte.
- Mocks limités au rendu, aux images, symboles, safe area et navigation native. Vrais builders de présentation, hooks de découverte et store Redux ; aucun réseau réel.
- Mutation : **NOT APPLICABLE**, présentation et composition uniquement, aucune décision métier modifiée.

Résultats finaux après intégration de l’addendum :

- `npx jest --watchman=false --runInBand` : **103 suites / 433 tests PASS**, régressions PR1/PR2/PR3 incluses.
- `npm run typecheck` : **PASS**.
- `npm run lint` : **PASS**, sans avertissement.
- `git diff --check` : **PASS**.

## Revue native reçue — 5 octobre, 13 h 57

Passe limitée à la clearance et aux preuves, sans modification du design ni du code applicatif. Les cinq captures de `assets/screens_PR4` ont été examinées :

| Capture | Preuve observable | Limite |
| --- | --- | --- |
| [IMG_5486](../../assets/screens_PR4/IMG_5486.PNG) | Pass haut **et bas**, quatre niveaux entièrement visibles au-dessus de la tab bar | Ne couvre pas l’attente de synchronisation |
| [IMG_5487](../../assets/screens_PR4/IMG_5487.PNG) | Début de liste, noms sur deux lignes, filtre renommé, vignettes | Café 1802 partiellement visible au bord du viewport ; ce n’est pas la fin de liste |
| [IMG_5488](../../assets/screens_PR4/IMG_5488.PNG) | Liste défilée, dernier café visible et sa photo dégagés | Rien ne prouve que le défilement maximal est atteint ; la dernière entrée visible est Le Café Alain Ducasse |
| [IMG_5489](../../assets/screens_PR4/IMG_5489.PNG) | Mes expériences, Options fermées | Hors des preuves restantes de la liste cafés |
| [IMG_5490](../../assets/screens_PR4/IMG_5490.PNG) | Mes expériences, Options ouvertes, gestion repliable | Hors des preuves restantes de la liste cafés |

### Clearance : vérification du code, preuve native finale encore manquante

La FlatList entière est dans `ScrollClearance` ; aucun footer fixe ni overlay supplémentaire dans la liste. Pour un inset inférieur de 34 points :

- haut de tab bar : hauteur de l’écran moins `(70 + 34 + 10)`, soit 114 points réservés ;
- bas du viewport : hauteur de l’écran moins 126 points, soit **12 points au-dessus de la tab bar** ;
- padding après la dernière cellule : **16 points** ;
- à la butée basse, la fin de la dernière cellule doit donc se trouver **28 points au-dessus de la tab bar**, sous réserve du layout natif réel.

La vignette est dans le flux de la cellule, au ratio 4:3 ; elle n’est pas positionnée en absolu. La découpe d’une cellule intermédiaire au bord inférieur du viewport n’indique pas, à elle seule, que la dernière cellule soit inaccessible. Aucune correction arbitraire du padding ni solution parallèle ajoutée. Le test de la vraie liste vérifie désormais aussi le padding final, en complément de la marge du viewport.

L’utilisateur confirme ensuite que le scroll n’avait pas été poussé jusqu’au bout sur les captures reçues. Elles ne démontrent donc pas un défaut de clearance en fin de liste ; cette preuve native reste à compléter. Tests ciblés rejoués après renforcement de l’assertion du padding final : **2 suites / 23 tests PASS** ; `git diff --check` **PASS**. Aucun code applicatif modifié pendant cette revue.

### Preuves restantes demandées

1. Tickets avec contenu, version PR4 (la capture de PR3 ne prouve pas le rendu actuel).
2. Pass en attente de synchronisation, **si cet état est disponible** ; aucun état métier « indisponible » séparé n’existe dans le view model actuel.
3. Liste avec un filtre réellement activé, par exemple « Avec photos ».
4. Recherche sans résultat, par exemple une chaîne absente du catalogue, avec l’état vide visible.
5. **Fin réelle de liste : validée par l’utilisateur sur iPhone.** Le contenu est dégagé et le menu ne gêne pas. Aucune capture supplémentaire exigée pour clore ce point ; preuve par retour utilisateur, sans nouvelle image archivée.

Le Pass bas d’écran est déjà documenté par IMG_5486 et n’a pas besoin d’être demandé une seconde fois pour cette configuration.

## Limite de production des captures

`xcrun simctl` reste indisponible lors de cette revue ; Xcode et les outils de capture d’un appareil ne sont pas installés. Les captures après PR4 ci-dessus ont été fournies par l’utilisateur ; aucune nouvelle capture n’a pu être produite ici. Les captures de `screens_PR3_rel` restent les références avant correction.

Checklist iPhone pour passer de REVIEW à GO visuel :

- Pass haut/bas et attente de synchronisation ;
- tickets avec contenu, vides, en erreur et avec données conservées ;
- permission caméra refusée et confirmation du scan ;
- Tous les cafés avec nom long, photo/placeholder, filtres et bascule carte ;
- fin de liste café et ticket entièrement dégagée au-dessus de la tab bar ;
- petit écran ou grande police, puis clavier sur recherche ;
- header de la modale scan sans double safe area.

Les tests React vérifient les props et callbacks ; ils ne prouvent pas la géométrie native, le comportement réel du clavier ou le rendu de Dynamic Type.
