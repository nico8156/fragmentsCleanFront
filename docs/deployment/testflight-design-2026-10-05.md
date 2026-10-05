# TestFlight — passe design mobile du 5 octobre 2026

Build demandé par l'utilisateur après les passes PR1–PR5 et la dernière
retouche splash / entrée / Google. Utilisation du backend actuel explicitement
confirmée par l'utilisateur : `fragments-staging.anchor-event.fr` (environnement
EAS nommé `production`). Cette livraison est un TestFlight de QA ; aucune
publication App Store ni modification des variables backend.

## Source et configuration

- Version : **1.0.0 (10)**, buildNumber incrémenté à distance par EAS de 9 à 10.
- Projet EAS : `@nico8156/fragmentsCleanFront`.
- Bundle : `com.nico8156.fragments` ; application ASC : `6810558661`.
- Commit design : `f4bd1c1`.
- Commit natif du checkout de build : `60db35c7a1454b4502959e1ab177e6c2eb8bf4ce`.
- Commit natif reporté dans le workspace : `dbb9b7e` ; même arbre Git
  `c63e773bd9151ec30f89ad3ea6b3f6ffe58a9391` que le checkout de build.
- Checkout isolé : `/private/tmp/fragments-testflight-f4bd1c1` ; captures et ZIP
  conservés dans le workspace, exclus de l'upload par `.easignore`.
- iOS régénéré avec les variables EAS de production, sans installation locale
  des pods. Retenus : assets light/dark, fond du splash et fond racine natif.
  Fichiers de projet/signature/Podfile existants conservés.
- Identifiants de signature et clé API App Store Connect déjà disponibles
  sur EAS ; aucune clé privée copiée dans le repo.

## Exécution

Commande exécutée dans le checkout propre :

```sh
eas build --profile production --platform ios --clear-cache \
  --auto-submit --non-interactive --no-wait \
  --message 'Design PR1-PR5, entree sobre et Google officiel — QA TestFlight'
```

- [Build EAS](https://expo.dev/accounts/nico8156/projects/fragmentsCleanFront/builds/a07d03a1-5797-4e11-9c2d-e7958cbeac12)
- [Soumission iOS](https://expo.dev/accounts/nico8156/projects/fragmentsCleanFront/submissions/80aeaec6-a3bc-48ba-9599-9935d72eed83)

Build terminé avec succès à 14:55:55 heure de Paris (`FINISHED`).
Soumission contrôlée à **15:00:13 heure de Paris : `FINISHED`, sans erreur**.
Le binaire est transmis à App Store Connect. Le traitement Apple et la
disponibilité pour installation dans TestFlight ne sont pas confirmés par
ce statut EAS.

## Vérifications avant build

- Suite complète : 105 suites, 443 tests passés.
- Typecheck et lint passés.
- Tests de configuration release : 14 passés.
- Tests Metro : 4 passés ; carte Redux à jour.
- Contrôle natif après régénération passé ; contrôles assets/splash : 3 passés.
- Config Expo de production résolue, valeurs requises présentes, sans afficher
  les secrets ; destination backend confirmée par l'utilisateur.
- `git diff --cached --check` passé avant le commit de livraison.

## QA iPhone

Installer ce build précis, puis vérifier lancement à froid, splash sombre sans
flash blanc, entrée courte / login / Home selon session, bouton Google couleur
et auth habituelle. Revoir clearance/tab bar sur Home, liste cafés, fiche,
Profil, Mes expériences, Tickets et Pass. Les captures PR5 utilisateur prouvent
l'harmonie Profil/Pass avant cette livraison ; elles ne remplacent pas le test
du nouveau binaire signé.

## Inspection du binaire signé

IPA exact téléchargé : `/tmp/fragments-testflight-1.0.0-10.ipa`, 21 358 924 octets.
Inspection avec `scripts/inspect-ios-ipa.mjs` passée : bundle/version/build
attendus, 13 manifests de confidentialité, entitlement Apple Sign In,
`get-task-allow=false`, entitlement beta TestFlight.

SHA-256 : `3c3571c6d9c6c4219581e032d18a5e4689dc0165497ca18128bb08e4f9c13d39`.
Fingerprint EAS du build : `9e71fc4bbb9cd36ac00afe05f88a0825a62d7cef`.

Signature : `integrity-checked-local-trust-unavailable` ; l'intégrité du code
est contrôlée, mais le certificat de distribution n'est pas reconnu par la
chaîne de confiance locale. Cela ne constitue pas une preuve de validation
Apple ; le résultat de la soumission est suivi séparément.

## Résultat de livraison

**Build et soumission réussis** : version 1.0.0 (10) envoyée à App Store Connect
pour TestFlight. Backend conservé confirmé disponible :
`GET /actuator/health` a retourné HTTP 200. Aucune publication App Store
ni activation de nouveaux groupes de testeurs effectuée.

Prochaine preuve attendue : installation depuis TestFlight après traitement
Apple, puis QA iPhone du splash, entrée/login et rendu des passes design.
