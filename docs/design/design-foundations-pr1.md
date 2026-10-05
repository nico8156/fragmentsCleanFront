# Primitives mobile — PR 1

Date : 5 octobre 2026. Référence : [Fragments Design 2026](fragments_design_2026_audit.md).

**Verdict : REVIEW — corrections foundations implémentées après la revue des cinq captures iPhone. Ces images documentent la première passe ; de nouvelles captures doivent confirmer les corrections de clearance, hero et barre système.**

## Périmètre et choix

Itération **CHORE visuel + REFACTORING de présentation**, route mobile **Read Feature**, limitée aux adaptateurs React. La suite de référence était verte avant extraction (3 suites, 11 tests). Aucun nouveau comportement métier ni changement de contrat.

- Tokens dans `app/adapters/primary/react/css/designTokens.ts` : palette café existante, surfaces sombre/claire, quatre niveaux typographiques, grille 8/12/16/24/32, rayons 12/16/24 et géométrie de navigation.
- Composants dans `app/adapters/primary/react/components/design/Primitives.tsx` : `FragmentsButton` (primaire, secondaire, tertiaire, danger), `FloatingIconButton`, `CompactCard`, `SectionHeader`, `ContentState` et présentation de sheet.
- Home : cards café plus compactes (chevron à la place de l'action répétée), bordures retirées, graisses réduites, Pass sans panneau, articles en rangées légères. Les photos gardent leur cache natif.
- Carte : mêmes contrôles flottants que Home, placement relatif à la safe area. La liste garde ses filtres ; ses états vide/cache réutilisent `ContentState`.
- Sheet : fond crème conservé, nom complet, informations sans cadres, texte sombre sur orange pour le primaire, secondaire tonal lisible. Hauteur selon le contenu, plafonnée à 58 % de la fenêtre ; défilement intégré pour les longs noms et grandes polices.
- Clearance commune via `ScrollClearance` : `70 + max(insetBas, 10) + 10 + 12` points. Home, liste carte, sheet et contrôle de localisation l'utilisent ; par exemple 126 points avec un inset de 34. La tab bar consomme la même géométrie. Home (y compris ses articles) et liste carte réservent cette zone **hors du viewport défilant**, avec clipping, plutôt qu’un simple padding qui ne protège que le dernier élément. Le catalogue articles utilise la même primitive avec la safe area seule : cette route est hors des onglets. Ces trois scrolls partagent aussi 16 points de padding final. La sheet conserve son padding et ajoute un footer opaque de même hauteur pour protéger le contenu pendant le scroll. Les écrans hors périmètre gardent leur constante legacy.

Les primitives reçoivent textes, états et callbacks. Elles ne décident ni de la fraîcheur ni des retries. Home conserve les messages du view model, dont « Hors ligne · contenu enregistré » et « Actualisation incomplète · réessaie ». Les variantes empty/loading/error/offline/stale partagent une présentation calme ; seul loading ajoute un indicateur. Aucune nouvelle bannière persistante ni politique réseau n'est introduite.

## Compromis

À la demande de la revue, le hero `MasterHeader` est raccourci (environ 452 au lieu de 546 points à 390 points de largeur), avec titre 26/32, intro 14/20 et contrôles sobres de 44 points. Sa hauteur peut augmenter avec la taille de texte pour dégager les contrôles ; ordre éditorial et pagination restent identiques. Les cards cafés gardent leur largeur et passent à 12 points de padding, sans bordure, avec un espace texte de 4 points. Le système de verre de la tab bar et son fallback opaque restent en place ; les petits contrôles utilisent une surface opaque, sans ombre ni bordure bleue.

Le viewport réduit laisse une bande vide derrière la tab bar : c’est le compromis retenu pour supprimer les superpositions sur toute la course du scroll, au prix de moins de contenu visible simultanément. La carte elle-même reste plein écran sous la barre.

La sheet garde une carte claire et seulement nom, statut, horaires, distance et deux actions. « Fermé » devient une information neutre, sans panneau rouge. Les grandes polices peuvent imposer de défiler jusqu'aux actions : elles ne sont pas tronquées pour maintenir artificiellement une hauteur fixe.

La palette legacy reste disponible pour éviter de restyler profil, fiche complète et contribution dans cette PR. Le variant danger est prêt mais aucune nouvelle action destructive n'est ajoutée.

Home reste read-only : 5 cafés maximum, 3 expériences maximum, articles déterministes, Pass dérivé du snapshot serveur. Aucun fichier backend, view model, Redux, gateway ou outbox n'est modifié.

## Captures iPhone

Les originaux avant (`assets/screens_fragments_design`) et après (`assets/screens_PR1`) sont conservés sans retouche. Les cinq captures après mesurent 1170 × 2532 pixels. Le modèle d'iPhone, la version iOS, la taille de texte configurée et le commit exécuté ne sont pas renseignés ; les positions de défilement et le café sélectionné diffèrent parfois. La comparaison porte sur la présentation, pas sur une différence pixel à pixel.

| Vue | Avant réel | Après réel |
| --- | --- | --- |
| Home, hero et rail | [IMG_5409](../../assets/screens_fragments_design/IMG_5409.PNG) | [IMG_5444](../../assets/screens_PR1/IMG_5444.PNG) |
| Home, cafés et Pass | [IMG_5410](../../assets/screens_fragments_design/IMG_5410.PNG) | [IMG_5445](../../assets/screens_PR1/IMG_5445.PNG) |
| Home, expériences et articles | [IMG_5411](../../assets/screens_fragments_design/IMG_5411.PNG) | [IMG_5446](../../assets/screens_PR1/IMG_5446.PNG) |
| Carte et contrôles | [IMG_5422](../../assets/screens_fragments_design/IMG_5422.PNG) | [IMG_5447](../../assets/screens_PR1/IMG_5447.PNG) |
| Preview café (Bourbon avant, Bluebird après) | [IMG_5423](../../assets/screens_fragments_design/IMG_5423.PNG) | [IMG_5448](../../assets/screens_PR1/IMG_5448.PNG) |

### Lecture visuelle du 5 octobre — avant corrections de revue

- **Home** : hiérarchie plus calme, bordures supprimées et action café réduite à un chevron. Le Pass s'intègre au flux. Les photos des expériences restent présentes ; les articles gagnent en lisibilité grâce aux rangées sans cadre. Le dernier article de `IMG_5446` apparaît entièrement au-dessus de la tab bar.
- **Carte** : les contrôles sont cohérents avec Home et le bouton de localisation dégage la tab bar dans `IMG_5447`. Les marqueurs et clusters gardent leur présentation.
- **Sheet** : le nom long de Bluebird tient sur deux lignes complètes. Horaires, distance, primaire et secondaire sont lisibles ; les deux actions sont au-dessus de la tab bar dans `IMG_5448`. L'absence de cadres internes rend la lecture plus directe. Le café différent ne permet pas de mesurer un gain de hauteur à contenu identique.
- **Défaut relevé et corrigé dans le code après captures** : le hero reste grand et la tab bar recouvre des sections pendant le scroll (`IMG_5444` / `IMG_5445`). Le padding seul était insuffisant. La revue demande une zone réservée hors viewport, un hero plus court et un rail moins dense ; les changements sont décrits ci-dessus et restent à capturer.
- **Réserve corrigée après captures** : l'heure et les icônes système sont noires sur le Home sombre (`IMG_5445` / `IMG_5446`). Le code montrait une `StatusBar` sombre dans la carte, conservée montée entre les onglets. `MapScreen` demande désormais du texte système sombre uniquement lorsque la carte claire est visible ; il demande du texte clair hors focus et dans la liste sombre. Cette correction visuelle doit encore être confirmée par une nouvelle capture après Carte → Home ; les images fournies précèdent ce correctif.

### Aperçus côte à côte

| Articles avant | Articles après |
| --- | --- |
| <img src="../../assets/screens_fragments_design/IMG_5411.PNG" width="240" alt="Home avant : expériences et articles encadrés" /> | <img src="../../assets/screens_PR1/IMG_5446.PNG" width="240" alt="Home après : expériences allégées et articles sans cadre" /> |

| Sheet avant | Sheet après |
| --- | --- |
| <img src="../../assets/screens_fragments_design/IMG_5423.PNG" width="240" alt="Preview Bourbon avant : titre tronqué et blocs encadrés" /> | <img src="../../assets/screens_PR1/IMG_5448.PNG" width="240" alt="Preview Bluebird après : titre complet et actions contrastées" /> |

### Recette restante

Les captures attestent le rendu statique de ces cinq vues. Elles ne permettent pas de valider les gestes, le clavier, VoiceOver, le mode avion ou une grande police. La capture locale automatisée reste indisponible faute de Xcode ; les captures après ci-dessus ont été fournies par l'utilisateur.

- [x] Comparaison visuelle des cinq vues Home / Carte / preview.
- [x] Dernier article Home visible et deux actions du preview dégagées sur les captures fournies.
- [ ] Nouvelles captures Home en haut, à mi-scroll et sur le dernier article : aucun contenu sous la barre ; hero et rail allégés. Même vérification dans la liste carte et au bas du catalogue articles.
- [ ] Après la correction : Carte → Home, vérifier heure/icônes blanches sur fond sombre ; carte claire en noir, liste sombre en blanc.
- [ ] Petit écran et taille de texte d'accessibilité : titres/labels lisibles, sheet défilable, deux actions accessibles au-dessus de la tab bar après défilement.
- [ ] Dernier café de la liste entièrement accessible en bas de défilement.
- [ ] Carte → marqueur → preview : contenu protégé de la tab bar sur toute la course du scroll, y compris en grande police ; fermeture de sheet par geste. Fiche café exclue de cette itération.
- [ ] Chargement du café : actions désactivées ; itinéraire indisponible sans coordonnées.
- [ ] Mode avion après cache : contenu visible, message Home hors ligne après actualisation ; état cache de la liste lors d'une lecture échouée.
- [ ] Localisation refusée : message visible sous les contrôles, carte toujours utilisable.
- [ ] Clavier des filtres : tab bar masquée ; retour normal après fermeture. Option Réduire la transparence : fallback de tab bar opaque.

## Preuves automatiques

Corrections de revue : **CHORE visuel / présentation**, même route Read Feature. Tests ciblés `designPrimitives`, `homeCarousel`, `homeContentSections`, `floatingTabBar`, `mapPreviewPresentation`, `releaseAccessibilityGuardrail` : **6 suites / 32 tests PASS**. Ils vérifient notamment la réservation hors viewport, la safe area sans onglets, le footer de sheet et la croissance du hero en grande police. `npm run typecheck`, `npm run lint` et `git diff --check` : **PASS** après ces corrections. Aucune mutation métier applicable. Les tests ne prouvent pas l’absence de chevauchement UIKit pendant un geste ; cette preuve demande les nouvelles captures et la recette iPhone.

Résultats exécutés sur les fondations livrées avant la revue des captures. Après la retouche visuelle de barre système : `npm run typecheck` **PASS**, lint de `MapScreen.tsx` **PASS**, suites `mapPreviewPresentation`, `floatingTabBar` et `releaseAccessibilityGuardrail` **PASS** (3 suites / 8 tests). Les 15 liens locaux de cette note sont vérifiés. Les nouveaux tests utilisent des mocks uniquement pour les vues natives, pas pour les ports métier.

| Vérification | Résultat |
| --- | --- |
| `npx jest --watchman=false --runInBand` | **96 suites / 376 tests réussis** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS**, aucun avertissement |
| `npm run redux:map:check` | **PASS**, documentation Redux à jour |
| `git diff --check` | **PASS** |
| Captures natives après modification | **REVIEW**, 5 captures utilisateur inspectées ; réserve barre système ci-dessus |
| Gestes et variantes d’accessibilité sur iPhone | **NOT RUN** par l’agent ; recette restante ci-dessus |

- Référence avant extraction : `npx jest --watchman=false --runInBand tests/adapters/secondary/viewModel/homeContentViewModel.spec.ts tests/adapters/primary/mapPreviewPresentation.spec.ts tests/adapters/primary/homeCarousel.spec.tsx` — **3 suites / 11 tests réussis**.
- Nouveaux tests : disponibilité et callbacks des quatre variants, états visuels, contrastes des textes, clearance, sélection absente/chargement, scroll de sheet, destinations Home et labels/état sélectionné des contrôles flottants.
- Limite : le renderer vérifie les propriétés et callbacks transmis aux vues natives ; il ne mesure ni les pixels UIKit, ni la reconnaissance des gestes, ni VoiceOver sur appareil.
- Checkpoint mutation : **NOT APPLICABLE**, passe visuelle/extraction de présentation sans modification de décision métier. Aucun mutant n'a été exécuté ni laissé dans le code. Pas de RED métier fabriqué.
- Incident d'environnement initial : Watchman échouait dans le sandbox ; exécution Jest avec `--watchman=false`. Les premiers tests de présentation ont nécessité de corriger le mock technique de `Pressable` ; ces échecs de setup ne sont pas comptés comme des RED métier.

## Blocage Metro corrigé pendant la recette

La capture du terminal du 5 octobre montrait `TypeError: events is not iterable`. Le CLI Expo installé (54.0.27) lit `eventsQueue`, alors que le Metro imposé par le durcissement des dépendances (0.83.8) émet `changes`. Ce contrat est visible dans le [code officiel Expo SDK 54](https://github.com/expo/expo/blob/sdk-54/packages/%40expo/cli/src/start/server/metro/waitForMetroToObserveTypeScriptFile.ts). Metro 0.83.8 apporte notamment une [correction de dépendance liée aux alertes CVE](https://github.com/react/metro/releases/tag/v0.83.8).

Correction **CHORE outillage** : `metro.config.js` installe `scripts/metro-watch-compat.cjs`. Ce pont, limité au CLI 54 avec Metro 0.83.8, ajoute la vue `eventsQueue` sans modifier `changes`. Les versions, le lockfile et `node_modules` restent inchangés. Retirer ce pont lors de la migration vers un CLI qui comprend le nouveau format ; le test de compatibilité est intégré à `verify:ci`.

Preuves : reproduction initiale avec les vrais observers Expo et l'émetteur Metro (**3 échecs**, dont le message exact du crash), puis **4 tests réussis** (`npm run test:metro:watch`). Ils couvrent ajout/modification/suppression, fichiers observés, découverte TypeScript, nettoyage des listeners, ancien format et installation idempotente. Lint et les **14 tests de configuration release** passent également. Pas de mutation métier applicable à ce correctif d'outillage.

Smoke test réel : Metro lancé temporairement sur `localhost:8082`, puis ajout, modification et suppression d'un fichier JS temporaire ; `/status` retourne `packager-status:running` après chacune des trois opérations. Le fichier de test est nettoyé. Ce contrôle ne vaut pas validation du rendu iPhone. Relance utilisateur : `npm run start:clean`, puis ouvrir le QR code dans le development build.
