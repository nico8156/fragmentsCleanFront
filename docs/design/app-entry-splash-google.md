# Entrée app, splash et bouton Google

5 octobre 2026. CHORE visuel et extraction locale de présentation.

## Résultat

- Splash Expo : fond `#0A0705`, icône Fragments existante centrée, largeur 112 pt, mode contain. Même identité et fond en light/dark. Aucun texte marketing, bouton ou animation ajoutée.
- Le placeholder Expo n'est plus référencé par le splash. L'icône existante contient déjà le symbole et le wordmark ; aucune nouvelle illustration ni modification du logo.
- Resources iOS versionnées mises en cohérence : storyboard centré, couleur nommée sombre, images natives 112/224/336 px générées avec le même outil `@expo/image-utils` que le plugin Expo. Aucun prebuild global, modification de projet Xcode, bundle ID, entitlement ou Podfile.
- L'entrée existante devient un seul écran scrollable avec safe area : « Fragments », « Ton carnet de cafés. », « Continuer ». Plus de slides, points, images marketing ou bouton Suivant. Le callback `onFinish` et la persistance de complétion existante restent inchangés.
- Login : fond café sombre, même identité et phrase courte. Les mentions légales restent disponibles dans le scroll au lieu d'être positionnées par-dessus le contenu.
- `GoogleSignInButton` : fond blanc, texte sombre « Continuer avec Google », minHeight 50 pt, logo couleur local non teinté rendu en contain à 20 pt, espace de 12 pt avec le texte, padding horizontal de 16 pt. Label accessible conservé pendant chargement, état busy/disabled annoncé. Le bouton Apple existant et sa disponibilité native restent inchangés.
- Le conteneur React initial et les états de chargement de navigation ont le fond principal sombre pour éviter une surface JS claire pendant le démarrage.

## Assets et références

Logo Google téléchargé sans modification depuis la [ressource officielle](https://developers.google.com/static/identity/images/g-logo.png), liée aux [consignes Google](https://developers.google.com/identity/branding-guidelines). Origine documentée dans `assets/images/google-g-source.md`. Aucun chargement réseau de l'image à l'exécution.

Splash configuré selon le plugin existant `expo-splash-screen`, sans ajouter de dépendance. [Documentation Expo](https://docs.expo.dev/versions/latest/sdk/splash-screen/) : les propriétés natives nécessitent un nouveau build ; Expo Go/dev-client ne constitue pas une preuve fiable du splash release.

Les anciennes illustrations et le placeholder restent dans les assets pour éviter une suppression hors scope ; ils ne sont plus utilisés par l'entrée/splash.

## Périmètre préservé

Aucun changement backend, auth métier, PKCE, callback auth, thunk/listener, SecureStore, session, deep link, tracking ou condition de navigation. Les conditions existantes décident toujours de l'entrée, du login ou de Home. Cette passe ne saute pas l'étape de complétion existante : elle la rend courte.

## Vérifications

- Présentation entrée/Google et tests auth existants : 3 suites, 17 tests passés, sans mock de view model ou port métier dans les nouveaux tests.
- `node --test scripts/entry-design-config.test.cjs` : 3 tests passés (fonds light/dark, identité locale, ressources et dimensions iOS, logo Google local).
- `npm run test:release:config` : 14 tests passés.
- `npm run native:release:check` : passé.
- Storyboard XML : valide ; assets PNG et références contrôlés.
- Suite complète finale `npx jest --watchman=false --runInBand` : **105 suites, 443 tests passés**.
- `npm run typecheck`, `npm run lint`, `git diff --check` : passés.
- `npx expo config --type public --json` : configuration résolue, paramètres splash contrôlés sans afficher les valeurs de configuration sensibles.
- Le premier passage complet a identifié une assertion de style local obsolète dans `releaseAccessibilityGuardrail` ; elle suit maintenant le bouton extrait et conserve le contrôle du label accessible et de sa typographie.
- Mutation testing : non applicable, présentation/configuration uniquement.

## Validation native restante

Aucun lancement iPhone/simulateur ni compilation Xcode possible dans cet environnement (simctl absent). Aucune nouvelle capture native produite. L'absence de flash blanc et le timing réel de la transition ne sont donc pas prouvés ici.

Après reconstruction/installation du build iOS : lancement à froid, fond sombre en modes clair et sombre, logo net centré, transition vers entrée/login/Home selon l'état existant, Continuer une seule fois, Google lisible, puis auth habituelle. Vérifier aussi petit écran et grande police. Aucun délai artificiel n'a été ajouté au splash.

**REVIEW rendu natif** pour cette dernière passe. Mise à jour livraison :
le build **1.0.0 (10)** a été compilé et transmis à App Store Connect pour
TestFlight avec succès le 5 octobre 2026. Voir le [reçu de livraison](../deployment/testflight-design-2026-10-05.md).
La QA sur le binaire installé reste à faire.
