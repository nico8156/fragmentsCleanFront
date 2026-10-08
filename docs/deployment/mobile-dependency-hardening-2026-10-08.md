# Correction des dépendances mobiles avant App Store

8 octobre 2026. Itération `CHORE`, route maintenance des dépendances et qualification de release. Base mobile : `cabe39781e9e608b2f9b9aaf66ea6b0129eeeeba`.

Quatre mises à jour ciblées sont appliquées et vérifiées. L'alerte critique est éliminée. Après autorisation explicite de l'utilisateur, le contrôle CI accepte temporairement les deux avis élevés détaillés ci-dessous, uniquement aux versions inspectées et avant le 22 octobre 2026 à 00:00 UTC. Le point dépendances est traité avec cette réserve temporaire ; les vulnérabilités restantes ne sont pas déclarées corrigées. La validation de l'archive destinée à Apple reste à effectuer.

## Changements

| Paquet | Avant | Après | Portée |
| --- | --- | --- | --- |
| shell-quote | 1.10.0 | 1.12.0 | Override existant actualisé ; outillage React DevTools |
| brace-expansion | 1.1.18 | 1.1.21 | Correction dans la même branche majeure, via minimatch |
| compression | 1.8.1 | 1.8.2 | Serveur de développement Expo |
| source-map-js | 1.2.1 | 1.2.2 | Chaîne PostCSS/Metro |

Seuls `package.json` et `package-lock.json` changent côté dépendances. Expo 54.0.37, React Native 0.81.5 et les dépendances natives restent inchangés. Le lockfile a été préparé dans une copie temporaire avec `npm update shell-quote source-map-js brace-expansion compression --package-lock-only --ignore-scripts`, puis installé par `npm ci --no-audit --no-fund` dans le dépôt mobile. Pas de `npm audit fix --force`.

L'audit actualisé avant correction signalait 77 entrées affectées, dont 3 critical et 53 high par propagation aux paquets parents ; 11 avis distincts étaient à l'origine de ces entrées. Après correction : 72 entrées, 0 critical, 51 high, 21 moderate, provenant de 5 avis distincts. Ces décomptes npm ne sont pas des nombres de failles indépendantes embarquées sur iPhone. Les 6 avis retirés comprennent 3 avis sur brace-expansion.

## Vérification

- Réinstallation exacte du lockfile : réussie, 1362 paquets installés.
- Jest : 105 suites et 443 tests réussis, avec `--runInBand --watchman=false`.
- TypeScript : réussi.
- ESLint app/tests : 0 erreur, 17 avertissements préexistants.
- Tests Metro : 4 réussis ; tests de configuration release : 14 réussis.
- Contrôle natif et carte Redux : réussis.
- Fingerprint iOS : `997218359e7f08da0706b0d723d0b42e267923bc`, identique à la mesure locale de l'audit précédent. Cela ne démontre pas l'identité avec l'IPA TestFlight.
- Export Metro/Hermes iOS avec source maps : réussi, 2440 sources référencées. Commande : `EAS_BUILD_PROFILE=preview CI=1 expo export --platform ios --source-maps --output-dir /tmp/fragments-mobile-security-ios-export`. Le profil preview permet de qualifier le bundling ; il ne certifie pas la configuration ni la signature d'une archive de production.
- Contrôle direct de shell-quote : la séquence avec commentaire suivie d'un retour ligne malveillant lève `TypeError` ; la citation ordinaire d'un argument avec espaces reste correcte. Aucune commande issue du cas malveillant n'est exécutée.
- L'audit brut `npm audit --audit-level=high --json` conserve son code de sortie 1, conformément aux deux avis élevés résiduels. Le nouveau contrôle évalue explicitement ces avis ; il ne neutralise pas globalement le code de retour npm.

Mutation non applicable aux quatre mises à jour de dépendances. Pour la nouvelle logique du contrôle de sécurité, quatre mutations manuelles ont été exécutées et détectées ; détails ci-dessous. Aucun nouveau build EAS, envoi Apple, commit ou déploiement dans ce lot.

## Alertes restantes et exposition

| Paquet et avis | Situation | Exposition observée |
| --- | --- | --- |
| braces 3.0.3, GHSA-vfj7-8cjw-p6xm, high | Aucune version corrigée publiée ; micromatch 4.0.8 utilise encore cette branche | Motifs de fichiers dans Jest/Metro ; absent des sources du bundle iOS exporté |
| node-forge 1.4.0, GHSA-86w9-cpqp-85rv, high | Aucune version corrigée publiée ; CLI Expo 54.0.27 utilise encore ce paquet | Certificats/signatures dans l'outillage Expo ; absent du bundle iOS exporté |
| decode-uri-component 0.2.2, GHSA-vcc3-ghjq-m6fr, moderate | Correctif 0.5.0 publié mais ESM, alors que query-string 7.1.3 utilise `require` avec appel direct ; Expo Router 6.0.24 dépend de query-string 7 | Présent dans le bundle iOS via le traitement des URL ; risque résiduel explicite, aucun override incompatible ajouté |
| sprintf-js, GHSA-hp3w-g68c-fv3c, moderate | Pas de version corrigée publiée observée | Via argparse, absent du bundle iOS exporté |
| uuid ancien via xcode, GHSA-w5hq-g745-h8pq, moderate | La branche corrigée est 11.1.1 ou ultérieure ; xcode demande ^7.0.3 | Génération `v4()` d'identifiants de projet ; version affectée absente du bundle. Le uuid applicatif 13 est distinct |

L'absence est établie sur les chemins des source maps de cet export local, pas par inspection d'une nouvelle IPA. L'outillage reste concerné par la sécurité : son absence du runtime iPhone ne justifie pas une suppression automatique des alertes.

Dans les usages examinés, braces reçoit les motifs de fichiers du développement et de la construction. La vérification de certificats Expo inspectée compare également la clé publique du certificat à la paire locale et vérifie sa correspondance avec la clé privée. Ces éléments réduisent certains scénarios d'exposition ; ils ne corrigent pas la bibliothèque cryptographique et ne constituent pas une analyse exhaustive de toute la CLI.

Sources : [signalement amont braces](https://github.com/micromatch/braces/issues/70), [avis node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [release shell-quote](https://github.com/ljharb/shell-quote/releases/tag/v1.12.0). Les branches publiées query-string 7, Expo Router 6, CLI Expo 54 et micromatch 4 ont été consultées : pas de mise à jour compatible supprimant les dépendances restantes au moment du contrôle.

## Exception autorisée et contrôle CI

Itération `CHORE`, route outillage/qualification de release mobile. Les orchestrateurs mobiles existants couvrent les parcours applicatifs ; aucun orchestrateur dédié aux dépendances n'existe. Aucune logique applicative ni frontière de contexte n'est modifiée.

L'utilisateur a autorisé explicitement la modification précise de la CI, après revue du risque résiduel dans l'outillage. La politique dans `scripts/security-policy.cjs` accepte uniquement :

- `GHSA-vfj7-8cjw-p6xm`, paquet `braces`, version `3.0.3` ;
- `GHSA-86w9-cpqp-85rv`, paquet `node-forge`, version `1.4.0`.

Expiration exclusive : **2026-10-22T00:00:00Z**, soit le 22 octobre à 02:00 à Paris. Aucun renouvellement automatique. Si ces avis restent nécessaires à cette date, le contrôle échoue. Si les dépendances sont corrigées et que l'audit ne nécessite plus d'exception, la date passée ne bloque pas un audit sain.

`npm run verify:ci` lance désormais les tests du contrôle puis `npm run security:check`, avant les vérifications existantes. Le workflow GitHub appelle déjà cette commande ; son fichier YAML et la détection des secrets restent inchangés. Un test protège ce raccordement.

Le contrôle :

- conserve le rapport npm JSON complet dans les logs et dans un dossier temporaire dont le chemin est affiché ;
- refuse toute autre alerte high, toute alerte critical, une version différente même imbriquée, un avis incohérent et une erreur d'audit ou de registre ;
- suit les dépendances `via` pour expliquer les alertes propagées aux paquets parents ;
- génère un nouvel export iOS preview avec source maps dans un dossier temporaire unique, et échoue si l'export ou ses preuves manquent ;
- inspecte les sources, y compris maps indexées et `sourceRoot`, pour refuser `braces` et `node-forge` dans le bundle ;
- affiche les exceptions et leur expiration sans masquer les trois avis modérés.

L'export preview vérifie le bundling du code courant. Il ne prouve pas la configuration, la signature ou le contenu exact d'une IPA App Store : requalifier le candidat de production avant soumission. Les rapports temporaires sont locaux sur le poste et éphémères sur le runner ; le JSON complet est conservé dans les logs du job, sans publication des source maps comme artefacts.

## Preuves du contrôle

`CI=1 npm run verify:ci` a été exécuté intégralement en local le 8 octobre 2026 : **code de sortie 0**. Résultats : 21 tests de sécurité, nouvel export et inspection de 2440 sources iOS, lint et TypeScript, 4 tests Metro, 105 suites Jest / 443 tests, carte Redux, 15 tests de configuration release, contrôle natif et génération du fingerprint. Le workflow GitHub distant, dont l'étape distincte de scan de secrets, n'a pas été exécuté par cette commande locale.

Fingerprint calculé après raccordement du contrôle : `6d7d29a2d83aa5b9c2dab30cc614bd5bfdd030c7`. Il diffère de la mesure antérieure citée ci-dessus ; le contrôle existant vérifie seulement sa génération et son format, pas son égalité avec une référence ni avec TestFlight. Aucune affirmation de compatibilité OTA ou d'identité avec l'IPA n'en découle. Les fichiers natifs et les versions de dépendances natives ne sont pas modifiés dans ce lot.

Les 21 tests ciblés couvrent les avis autorisés, une nouvelle alerte sur un paquet déjà accepté, une criticité accrue, l'expiration à la milliseconde près, les versions imbriquées, les erreurs/incohérences npm et les preuves de bundling absentes ou contenant les paquets interdits.

Mutations manuelles exécutées dans quatre copies isolées sous `/tmp/fragments-security-mutant-*` : suppression du refus à expiration, suppression de la comparaison de version, remplacement du refus d'avis inconnu par `continue`, suppression du refus de paquet présent dans une source map. Chaque mutation a produit un échec d'assertion attendu dans les tests correspondants ; aucun survivant dans cette sélection. Les originaux n'ont pas été mutés et les 21 tests repassent dans la commande CI. Ce contrôle ciblé n'est pas un score de campagne globale.

## Suivi avant publication

Appliquer une correction amont compatible dès qu'elle est disponible, supprimer l'exception devenue inutile et réexécuter la qualification. Avant le 22 octobre ou avant soumission si elle arrive plus tôt, réexaminer les avis et les preuves du candidat. Les alertes modérées restent suivies, particulièrement `decode-uri-component` embarqué et son exposition aux URL. Aucune migration générale d'Expo n'est justifiée par ce lot.

Journal de la vérification complète : `/tmp/fragments-security-verify-ci.log`. Les journaux des correctifs précédents et leurs limites restent décrits ci-dessus.
