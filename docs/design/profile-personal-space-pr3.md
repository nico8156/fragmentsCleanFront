# PR3 — Profil et espace personnel

**Clôturée — validée utilisateur le 5 octobre 2026**, y compris les scénarios natifs restants. Les réserves de revue ci-dessous décrivent les étapes antérieures ; PR4 prend le relais.

## Revue visuelle — retour compact et clearance

Direction générale validée par l’utilisateur le 5 octobre. Correction ciblée `CHORE` de présentation, route UI/navigation : `ProfileHeader` remplace l’en-tête système de la pile Profil pour supprimer la capsule grise portant le nom de l’écran précédent. Il utilise le même `FloatingIconButton compact` de **44 × 44 points** et le même chevron que la fiche café. Le bouton appelle `navigation.goBack()` et n’apparaît pas à la racine. Le titre peut revenir à la ligne, sans hauteur fixe ; les safe areas supérieure et latérales sont prises en compte. La pile de navigation et ses destinations restent inchangées.

Clearance vérifiée dans le code et les tests sur Mes expériences, Favoris, Tickets, Paramètres et Modifier profil : tous passent par `ProfileLayout`, qui réserve hors du viewport la hauteur de la tab bar + inset inférieur + espacement. Avec un inset inférieur de 34 points, cette réserve vaut 126 points ; le contenu ajoute encore 16 points après le dernier élément. Aucun padding indépendant ajouté dans les screens. Les captures reçues montrent notamment les derniers éléments Favoris, Tickets et Modifier profil au-dessus de la tab bar ; elles ne prouvent pas les variantes grande police ou clavier.

Validation après correction : **4 suites / 44 tests PASS** (`profilePresentation`, `profileNavigationGuardrail`, `designPrimitives`, `experiencePresentation`), `npm run typecheck`, `npm run lint`, `git diff --check` **PASS**. Le test du header couvre le contrôle 44 points, le callback retour, l’absence de retour à la racine et un titre non tronqué. Les protections de clearance couvrent le layout et son utilisation par les cinq écrans. Mutation : **NOT APPLICABLE**, ajustement visuel sans décision métier.

Compromis : l’en-tête est rendu par React dans la pile native pour maîtriser sa présentation ; le menu système attaché à la capsule retour n’est plus proposé. La validation iPhone du nouveau header reste à faire.

## Correctif du warning de sélection Redux

Retour natif du 5 octobre : `AppSettingsScreen` créait un nouveau tableau via `Object.values` à chaque sélection des utilisateurs bloqués. Correction technique `BEHAVIOUR`, route lecture `commentWl` : extraction d’un sélecteur mémoïsé sur le dictionnaire `blockedUsers`, utilisé par l’écran. Aucun changement de règle de modération, de reducer ou de callback.

Preuves : les deux tests de régression échouent sur l’ancienne conversion non mémoïsée (égalité de référence), puis passent avec le correctif. Ils couvrent la stabilité même après un changement du chargement, ainsi que les mises à jour lors du blocage/déblocage. Vérification ciblée commentaires + présentation profil : **9 suites / 35 tests PASS**. Typecheck et lint : **PASS**. Mutation manuelle exécutée : retrait de la mémoïsation, **KILLED** par les deux assertions de référence ; sélecteur restauré puis tests repassés. `git diff --check` : **PASS**. Pas de nouvelle capture native disponible pour confirmer la disparition du warning sur l’appareil.

Date : 5 octobre 2026. PR2 validée par l’utilisateur. PR3 : direction générale validée, corrections visuelles ciblées à revoir sur iPhone.

## Périmètre et choix

Itération `CHORE` visuelle avec extractions `REFACTORING` de présentation ; route mobile de lecture existante, sans changement des view models ni des contrats.

- Profil : avatar partagé Pass réduit à 80 points, nom complet sans limite de lignes, initiale et nom « Utilisateur » en l’absence d’identité, email secondaire, accès existant à l’édition.
- Carnet personnel : accès compacts à Mes expériences, Cafés favoris, Mes tickets et Compte et réglages. Sections sans cadres imbriqués, lignes accessibles d’au moins 44 points.
- Favoris : suppression du rappel d’identité, noms complets, adresse déjà disponible, état vide, chargement, erreur avec réessai et mise à jour optimiste conservés. `FavoritesContent` ne reçoit que le view model existant et le callback d’ouverture.
- Compte : actions textuelles plus sobres, déconnexion visible, suppression sans grand fond rouge et avec la confirmation existante. Liens légaux lisibles sur fond sombre. Extraction de `AccountActions` pour vérifier les callbacks et la confirmation.
- Navigation : en-têtes de la pile profil harmonisés (voir correction du retour ci-dessus) ; `ProfileLayout` utilise le `ScrollClearance` partagé de PR1. Le viewport défilant s’arrête au-dessus de la tab bar, avec prise en compte de l’inset inférieur. Ajustement clavier et rafraîchissement conservés.
- Mes expériences : composition PR2 conservée, noms complets et média 4:3. Modifier, Supprimer et Supprimer la photo restent sous Options ; Publier reste visible sur un brouillon. Statuts et messages média restent hors menu. Confirmations de suppression conservées.

Les composants communs de profil améliorent aussi la présentation des écrans liés, dont les tickets, sans toucher à leurs données ni à leurs actions.

## Compromis et exclusions

Le statut affiché dans le header concerne la mutation du profil déjà exposée par `useAuthUser`. Aucun indicateur global d’outbox n’a été inventé. Le view model des favoris ne fournit pas de statut ouvert/fermé : aucun calcul ou chargement supplémentaire n’a été ajouté.

La clearance réserve une bande basse au viewport : elle réduit légèrement la hauteur de lecture pour éviter que le contenu passe derrière la navigation flottante. Les noms peuvent prendre plusieurs lignes ; les contrôles utilisent des hauteurs minimales plutôt que fixes. Le rendu avec Dynamic Type reste à vérifier nativement.

Aucun changement backend, Redux métier, DTO, politique offline/outbox/cache ou invariants Pass. Aucun nouveau flux d’upload avatar ; le flux existant reste inchangé. Aucun fetch dans les screens. Les confirmations et callbacks existants sont réutilisés.

## Vérifications exécutées

- Baseline avant PR3 : expériences, primitives et navigation profil, **3 suites / 29 tests PASS**.
- Tests ciblés finaux : `profilePresentation.spec.tsx`, `experiencePresentation.spec.tsx`, `profileNavigationGuardrail.spec.ts`, `releaseAccessibilityGuardrail.spec.ts` : **4 suites / 24 tests PASS**.
- Suite complète : `npx jest --watchman=false --runInBand` : **100 suites / 410 tests PASS**.
- `npm run typecheck` : **PASS**, après ajout du champ `error: undefined` manquant dans une fixture de favoris.
- `npm run lint` : **PASS**.
- `git diff --check` : **PASS**.

Les tests de rendu couvrent identité avec/sans nom et avatar, navigation des raccourcis, favoris pleins/vides/chargement/erreur/pending, callbacks du compte et confirmation destructive, labels et clearance. Les tests expériences vérifient les quatre statuts, les menus indépendants sur plusieurs cards, les confirmations, les messages média visibles et Publier sur les brouillons.

Mutation testing : **NOT APPLICABLE**, changements purement visuels et extractions de présentation sans décision métier ni algorithme modifié. Aucun RED métier artificiel.

## Captures natives reçues et manquantes

Sept captures utilisateur examinées dans `assets/screens_PR3` :

| Capture | Écran / état observé |
| --- | --- |
| [IMG_5477](../../assets/screens_PR3/IMG_5477.PNG) | Profil et raccourcis |
| [IMG_5478](../../assets/screens_PR3/IMG_5478.PNG) | Expérience publiée, Options fermées |
| [IMG_5479](../../assets/screens_PR3/IMG_5479.PNG) | Plusieurs expériences, Options fermées |
| [IMG_5480](../../assets/screens_PR3/IMG_5480.PNG) | Favoris avec contenu et nom long |
| [IMG_5481](../../assets/screens_PR3/IMG_5481.PNG) | Tickets avec contenu |
| [IMG_5482](../../assets/screens_PR3/IMG_5482.PNG) | Paramètres, actions du compte |
| [IMG_5483](../../assets/screens_PR3/IMG_5483.PNG) | Modifier profil, bouton Enregistrer dégagé |

Ces images précèdent la correction du header et ne sont pas des captures après modification.

Captures supplémentaires **NOT RUN** : Xcode et le simulateur iOS restent absents ; `xcrun simctl` échoue. Aucun outil de capture d’appareil disponible. Aucun nouvel état de données n’a été forcé sur le compte utilisateur. Les tests React ne valident ni la géométrie native ni le clavier réel.

Scénarios restant à capturer sur un appareil de test :

- ouvrir Options sur une expérience avec photo, avec statut et messages média visibles ;
- afficher un brouillon existant avec Publier visible, sans le publier ;
- afficher une expérience dont le média est en attente ;
- afficher des favoris vides, puis une erreur de chargement avec Réessayer (profil de test adapté) ;
- activer une grande taille de texte ou utiliser un petit iPhone, parcourir les cinq écrans jusqu’au dernier élément, puis vérifier Modifier profil avec clavier ouvert ;
- inclure le nouveau retour compact dans les captures après rechargement.
