# Fragments Design 2026 - Audit et plan de reprise

Date : 2026-10-05
Source : 39 captures iPhone 1170 x 2532 du dossier `screens_fragments_design`

## Verdict rapide

Fragments a deja une identite reconnaissable : univers sombre, brun cafe, accents orange, imagerie cafe, logique communautaire, carte, pass, tickets, experiences et profil. Il ne faut pas repartir a zero. Le bon travail est une passe de direction artistique et UX globale : clarifier, respirer, hierarchiser, unifier.

Le risque principal n'est pas le manque de style. C'est l'exces de poids visuel et la concurrence entre trop d'elements importants en meme temps : gros headers, cards tres presentes, boutons massifs, tab bar flottante, actions multiples, formulaires visibles trop tot, sections nombreuses.

La cible recommandee :

> Un guide cafe premium, editorial, calme et instinctif, pas un dashboard social sombre.

## Contraintes de direction

1. Respecter l'identite Fragments existante.
   - Garder le dark theme.
   - Garder le brun cafe / orange comme accent.
   - Garder l'approche photo + contenu editorial.
   - Garder l'idee de progression, tickets, pass et experiences.

2. Aller vers une sobriete Apple-like.
   - Moins d'effets.
   - Moins de cadres.
   - Moins de boutons visibles en permanence.
   - Plus de hierarchie, d'espace et de continuite.

3. Rendre l'app instinctive.
   - Chaque ecran doit dire immediatement : ou suis-je, qu'est-ce qui compte, quelle action vient ensuite.
   - La navigation doit se comprendre sans explication.
   - Les actions secondaires doivent rester disponibles mais ne pas voler la vedette.

## Ce qui fonctionne deja

### Identite

L'app a une vraie atmosphere. Le noir/brun, les tons cafe, les illustrations d'articles et les photos donnent une signature claire. On sent deja un produit autour du cafe de specialite a Rennes, pas une app generique.

### Home

La home pose les bons objets : articles, cafes proches, pass, experiences, lecture. La structure produit est bonne. Elle raconte deja que Fragments n'est pas seulement une carte de cafes.

### Carte

La carte est probablement le parcours le plus naturel aujourd'hui. Elle est lisible, directe, geographique, avec des actions evidentes. Le bottom sheet clair fonctionne bien parce qu'il respire davantage que les ecrans dark.

### Fiche cafe

La fiche cafe contient les bonnes matieres : statut, favoris, commentaires, actions, photos, experiences, infos pratiques. Le produit est riche. Il faut maintenant organiser cette richesse.

### Profil / pass

Le systeme de pass, objectifs, tickets, favoris et experiences donne une boucle d'engagement interessante. C'est un vrai differentiant. Il faut eviter qu'il ressemble a une zone de gestion trop administrative.

## Probleme central

Fragments a plusieurs bons langages visuels, mais ils ne sont pas encore parfaitement reconcilies :

- onboarding sombre et illustre ;
- home tres immersive et editorialisee ;
- carte claire, quasi native ;
- fiche cafe dark dense et tres encadree ;
- profil avec barre superieure brun clair ;
- scan ticket avec panneau sombre/brun ;
- listes profil plus proches d'une app de gestion.

Pris separement, beaucoup d'ecrans fonctionnent. Ensemble, ils donnent parfois l'impression de plusieurs sous-produits. Le design system doit donc unifier les patterns, pas seulement harmoniser les couleurs.

## Principes Fragments Design 2026

### 1. Le contenu d'abord

Les photos, les noms de cafes, les experiences et les articles doivent dominer. Les cadres, icones et boutons doivent soutenir le contenu, pas occuper le premier plan.

Regle : si un composant decoratif attire plus l'oeil que le cafe ou l'experience, il est trop fort.

### 2. Une action principale par ecran

Chaque ecran doit avoir une action naturelle :

- Home : explorer un cafe ou poursuivre une lecture.
- Carte : choisir un cafe.
- Bottom sheet : ouvrir la fiche ou lancer l'itineraire.
- Fiche cafe : voir l'essentiel, puis contribuer.
- Profil : retrouver ses contenus.
- Scan : envoyer un ticket lisible.

Les actions secondaires doivent etre accessibles mais visuellement subordonnees.

### 3. Moins de cards, de meilleures sections

Aujourd'hui, beaucoup de contenus sont dans des boites. Cela structure, mais alourdit. Il faut reserver les cards aux objets repetes ou interactifs : cafe, experience, ticket, article. Les sections entieres ne doivent pas toutes devenir des cadres.

### 4. Les photos comme respiration

Les images doivent apporter de la lumiere et du reel. Elles doivent souvent remplacer du chrome UI. Sur fiche cafe, une belle photo peut faire plus premium que trois badges et quatre bordures.

### 5. Un langage d'action stable

Aujourd'hui, les actions changent beaucoup de forme : gros boutons, pills, icones encadrees, liens orange, boutons danger, boutons sombres. Il faut stabiliser :

- CTA primaire : bouton plein orange.
- CTA secondaire : bouton discret outline ou tonal.
- Action iconique : icone seule dans un cercle/pill sobre.
- Lien editorial : texte orange sans cadre.
- Danger : rouge, mais rare et reserve aux actions destructrices.

## Recommandations par parcours

## 1. Onboarding et authentification

Captures : IMG_5403 a IMG_5407

### Diagnostic

L'onboarding est coherent, simple et bien aligne avec l'univers. Les illustrations donnent une identite sympathique. Le login est tres sobre.

### A corriger

- Les textes secondaires sont parfois trop faibles en contraste.
- Les illustrations peuvent paraitre un peu grosses par rapport au texte.
- Le bouton `Passer` est tres discret, ce qui est acceptable, mais il faut verifier que le parcours reste clair.
- Le bouton Apple est en anglais (`Continue with Apple`) alors que le reste est en francais.

### Direction

Garder ce parcours quasiment tel quel, mais le polir :

- meme hauteur d'illustration sur chaque slide ;
- meme grille verticale ;
- textes secondaires plus lisibles ;
- boutons homogenes ;
- libelles entierement francais.

Priorite : basse. Ce n'est pas le chantier principal.

## 2. Home / feed editorial

Captures : IMG_5408 a IMG_5412

### Diagnostic

La home est riche et donne envie. Mais elle est aussi tres chargee. Le hero article prend enormement de place, les boutons flottants de recherche/scan sont tres visibles, les cards cafes sont massives, puis la tab bar coupe la lecture.

Le probleme n'est pas l'idee : article + cafes + pass + experiences + lecture. Le probleme est la competition visuelle.

### A corriger

- Hero trop haut et trop dense.
- Titre hero souvent tronque, ce qui donne une impression moins premium.
- Boutons recherche/scan trop lourds en superposition.
- Cards cafes proches trop hautes et tres encadrees.
- Tab bar flottante qui recouvre parfois les contenus.
- Les sections ont toutes un poids similaire : article, cafes, pass, experiences, lecture.

### Direction

Faire de la home une composition editoriale calme :

1. Header discret : `Fragments`, recherche, scan.
2. Hero article plus maitrise : image forte, titre lisible sur 2 lignes max, categorie discrete.
3. Section `Cafes pres de toi` plus legere : cards moins hautes, moins de bordures, plus de focus sur nom + distance + statut.
4. `Prochaine etape` doit devenir une incitation douce, pas un gros panneau.
5. `Tes experiences` et `A lire ensuite` doivent etre differencies : social d'un cote, editorial de l'autre.

### Proposition de hierarchie

Ordre recommande :

1. Hero editorial du jour.
2. Cafes pres de toi.
3. Ton pass / prochaine action.
4. Experiences recentes.
5. Articles a lire.

La home ne doit pas tout expliquer. Elle doit donner envie d'ouvrir.

Priorite : haute.

## 3. Recherche, scan ticket et photo

Captures : IMG_5413 a IMG_5418

### Diagnostic

La recherche est claire. Le scan ticket a une bonne intention : une tache simple, guidee, avec validation de lisibilite. Le parcours camera fonctionne.

### A corriger

- L'ecran recherche vide pourrait mieux guider sans faire "formulaire".
- Les chips `Nom`, `Ville`, `Adresse` sont utiles mais visuellement un peu techniques.
- Le scan ticket utilise un panneau tres sombre et haut, avec beaucoup de texte centre ; il peut etre plus direct.
- L'etat photo prete est bon, mais l'image pourrait etre mieux integree dans une zone de verification.

### Direction

Recherche :

- garder un search bar natif ;
- afficher des suggestions utiles : cafes recents, favoris, categories ;
- prevoir un etat zero resultat tres simple.

Scan :

- rendre l'action principale evidente : `Prendre une photo`, puis `Envoyer le ticket` ;
- garder un seul conseil court ;
- afficher l'etat de lisibilite comme feedback positif, pas comme bloc supplementaire.

Priorite : moyenne.

## 4. Carte et bottom sheet

Captures : IMG_5419 a IMG_5423

### Diagnostic

La carte est l'un des meilleurs morceaux UX. Elle est lisible, directe et peu cerebrale. Le bottom sheet clair fonctionne bien parce qu'il presente peu d'informations : nom, statut, distance, actions.

### A corriger

- La carte claire tranche fortement avec l'univers dark. Cette rupture peut etre acceptee, mais elle doit etre assumee.
- Les boutons flottants haut gauche/droite doivent avoir exactement la meme logique que ceux de la home.
- Le bottom sheet ne doit pas entrer en conflit avec la tab bar.
- Les pins et clusters doivent rester lisibles sans devenir trop lourds.

### Direction

Garder la carte claire. C'est probablement le bon choix : une carte sombre serait moins lisible et moins familiere.

En revanche :

- harmoniser les controles flottants ;
- rendre le bottom sheet plus premium, avec moins de cadres internes ;
- clarifier les boutons : `Voir la fiche` primaire, `Itineraire` secondaire ;
- prevoir un sheet mi-hauteur propre si plusieurs cafes sont proches.

Priorite : haute, car c'est dans le golden path.

## 5. Fiche cafe

Captures : IMG_5424 a IMG_5430

### Diagnostic

C'est l'ecran le plus important a retravailler. Il contient les bonnes informations, mais il donne une impression dense et parfois administrative.

Le header prend beaucoup de place. Les quatre actions principales sont massives. Les photos, experiences, formulaire, infos pratiques et commentaires apparaissent dans une meme logique de blocs empiles. Le resultat est riche, mais pas encore fluide.

### A corriger

- Header trop lourd.
- Titre tronque trop tot.
- Badge `FERME` tres dominant.
- Compteurs coeur/commentaire visibles trop haut, meme quand ils ne sont pas l'information principale.
- Actions `Itineraire`, `Favori`, `Appeler`, `Partager` trop grosses.
- Formulaire d'experience visible trop tot.
- `Ajouter une photo`, `Supprimer la photo`, `Modifier`, `Supprimer` dispersent l'attention.
- Infos pratiques et commentaires arrivent dans un flux dense.

### Direction

La fiche cafe doit devenir une fiche de lieu premium, pas un panneau de moderation personnelle.

Structure recommandee :

1. Header compact :
   - retour ;
   - nom complet lisible ;
   - statut discret ;
   - favoris/commentaires en actions secondaires.

2. Photo principale :
   - grande, propre, respirante ;
   - pas trop encadree ;
   - eventuellement carousel sobre.

3. Resume utile :
   - adresse courte ;
   - distance ;
   - ouvert/ferme ;
   - phrase ou note editoriale si disponible.

4. Actions :
   - itineraire en primaire ;
   - favori, appeler, partager en icones secondaires.

5. Experiences :
   - section forte, car c'est le coeur communautaire ;
   - si vide : invitation simple, pas formulaire complet direct.

6. Infos pratiques :
   - liste compacte ;
   - telephone/site/horaires/adresse.

7. Commentaires :
   - apres les infos essentielles ;
   - formulaire replie ou champ discret.

### Regle cle

Ne pas afficher les outils de contribution comme si l'utilisateur etait deja en train d'ecrire. D'abord inspirer, ensuite proposer de contribuer.

Priorite : tres haute.

## 6. Pass, profil, tickets, favoris, experiences, parametres

Captures : IMG_5431 a IMG_5441

### Diagnostic

La zone profil contient beaucoup de valeur : progression, objectifs, tickets, favoris, experiences, parametres. Elle montre que Fragments est plus qu'un annuaire.

Mais elle change de langage : barre superieure brun clair, listes encadrees, nombreux panneaux, boutons destructifs tres visibles. Cette zone est fonctionnelle mais moins premium.

### A corriger

- Barre superieure brun clair a harmoniser ou assumer comme convention "compte".
- Trop de cadres empiles.
- Avatar tres present sur toutes les sous-pages, parfois inutile.
- Les listes favoris/tickets/experiences pourraient etre plus simples.
- Les actions destructrices dans `Mes experiences` sont trop visibles en lecture.
- Parametres : les gros boutons finaux sont clairs, mais tres lourds visuellement.

### Direction

Faire du profil une zone calme et personnelle :

- Profil principal : avatar, nom, menu simple.
- Pass : progression visuelle plus claire, objectifs en liste legere.
- Tickets : historique compact.
- Favoris : liste de lieux, tres lisible.
- Experiences : cards sociales, mais actions `Modifier` / `Supprimer` en menu secondaire.
- Parametres : liste native, danger zone separee et plus basse.

Priorite : moyenne apres home/carte/fiche cafe.

## Design system a stabiliser

### Couleurs

Conserver :

- fond principal dark cafe ;
- surface brun tres sombre ;
- accent orange/caramel ;
- rouge pour danger ;
- vert pour validation ;
- bleu uniquement si action systeme exceptionnelle.

A eviter :

- trop de nuances de brun concurrentes ;
- orange utilise pour tout ;
- fonds clairs hors carte si non justifies ;
- boutons danger trop presents.

### Typographie

Limiter a 4 niveaux :

- Grand titre ecran.
- Titre de section.
- Titre de card.
- Meta / aide / description.

Le gras est parfois trop present. Un produit premium utilise souvent moins de gras, mais mieux.

### Espacements

Definir une grille simple :

- 8 : micro espace ;
- 12 : interieur compact ;
- 16 : standard ;
- 24 : separation de sections ;
- 32 : grande respiration.

Eviter les sections trop collees a la tab bar flottante.

### Cards

Regle :

- card pour un objet repetable ;
- pas de card autour de toute une section ;
- rayon stable ;
- bordure subtile ou fond, pas les deux de maniere trop forte ;
- hauteur determinee par le contenu, pas par un style massif.

### Tab bar

La tab bar est globalement bonne, mais elle doit etre traitee comme un objet systeme :

- hauteur stable ;
- marge basse stable ;
- pas de recouvrement de CTA critique ;
- libelles courts ;
- etat actif clair mais sobre.

### Boutons

Limiter les styles :

- primaire plein orange ;
- secondaire tonal sombre ;
- tertiaire texte orange ;
- icone circulaire sobre ;
- danger rouge, rare.

## Golden path recommande

Le premier chantier doit etre :

> Home -> Carte -> Bottom sheet cafe -> Fiche cafe -> Experience

C'est la colonne vertebrale du produit. Si ce parcours devient excellent, le reste de l'app suivra naturellement.

### Objectif du golden path

L'utilisateur doit pouvoir :

1. ouvrir l'app ;
2. comprendre quoi decouvrir ;
3. ouvrir la carte sans friction ;
4. choisir un cafe ;
5. comprendre rapidement pourquoi ce cafe vaut le coup ;
6. voir ou contribuer a une experience ;
7. revenir sans se sentir perdu.

## Ordre de travail recommande

### Phase 1 - Foundations UI

Livrable :

- tokens couleurs ;
- echelle typographique ;
- espaceurs ;
- rayon/bordures ;
- boutons ;
- cards ;
- section headers ;
- tab bar ;
- bottom sheet ;
- empty states.

But : eviter de refaire chaque ecran a la main.

### Phase 2 - Golden path

Ecrans :

- Home ;
- Carte ;
- Bottom sheet ;
- Fiche cafe ;
- Experience vide / experience existante.

But : creer la reference qualite.

### Phase 3 - Contribution et scan

Ecrans :

- recherche ;
- scan ticket ;
- photo ;
- validation ticket ;
- contribution experience.

But : rendre les actions simples, rassurantes, non cerebrales.

### Phase 4 - Profil et pass

Ecrans :

- pass ;
- profil ;
- tickets ;
- favoris ;
- experiences ;
- parametres.

But : calmer la zone compte et rendre la progression motivante.

### Phase 5 - Polish release

Checklist :

- loading ;
- empty states ;
- erreurs ;
- offline ;
- permissions camera/localisation ;
- clavier ;
- safe areas ;
- tab bar overlap ;
- accessibilite ;
- tailles de texte ;
- contrastes ;
- microcopy ;
- transitions.

## Prompts de reprise pour Codex

### Prompt principal

Tu travailles sur l'app mobile Fragments. Objectif : appliquer une passe UI/UX premium sans changer l'identite du produit.

Contraintes :

- conserver l'univers dark cafe / brun / orange ;
- ne pas transformer l'app en dashboard SaaS ;
- viser une sobriete Apple-like : hierarchie, respiration, alignement, peu d'artifices ;
- rendre la navigation instinctive ;
- ne pas empiler des effets visuels ;
- privilegier le contenu : photos, cafes, experiences, articles ;
- stabiliser les patterns avant de modifier tous les ecrans.

Priorite :

1. extraire/stabiliser les tokens et composants communs ;
2. retravailler le golden path `Home -> Carte -> Bottom sheet cafe -> Fiche cafe -> Experience` ;
3. eviter les regressions sur scan ticket, profil, pass, favoris et experiences ;
4. verifier sur simulateur mobile que la tab bar ne masque jamais les CTA.

Points design majeurs :

- Home : calmer le hero, alleger les cards, clarifier la hierarchie des sections.
- Carte : garder la lisibilite, harmoniser les boutons flottants, rendre le bottom sheet plus premium.
- Fiche cafe : gros chantier. Header plus compact, actions moins massives, formulaire contribution replie, experiences mises en valeur, infos pratiques compactes.
- Profil : simplifier les listes, reduire les cadres, cacher les actions destructrices derriere des menus secondaires quand possible.

Livrable attendu :

- changements front scopes ;
- composants reutilisables ;
- screenshots avant/apres ;
- verification iPhone ;
- note des compromis si certaines parties dependent du backend.

### Prompt court pour une premiere PR

Commence par une PR front uniquement qui stabilise le design system mobile Fragments : tokens couleurs, typographie, espaceurs, boutons, cards, section headers, tab bar, bottom sheet. Ne change pas encore tous les ecrans. Applique ensuite ces composants au golden path Home -> Carte -> Bottom sheet -> Fiche cafe. Objectif : moins de poids visuel, plus de respiration, meme identite Fragments.

## Definition of done design

Un ecran est valide si :

- l'action principale est visible en moins de 2 secondes ;
- les actions secondaires ne concurrencent pas l'action principale ;
- aucune information importante n'est masquee par la tab bar ;
- les titres importants ne sont pas tronques inutilement ;
- le meme type de contenu utilise le meme pattern ailleurs ;
- l'ecran reste lisible avec clavier, loading, empty state et erreur ;
- le rendu donne plus envie d'explorer que de gerer.

## Priorites finales

1. Fiche cafe : plus gros gain UX et premium.
2. Home : premiere impression produit.
3. Carte + bottom sheet : coeur de decouverte.
4. Experiences : differenciant communautaire.
5. Profil/pass : engagement et retention.
6. Scan ticket : boucle de progression.
7. Onboarding : polish final.

## Conclusion

Fragments n'a pas besoin d'un redesign spectaculaire. L'app a besoin d'une direction plus stricte.

La meilleure approche est de retirer du bruit, pas d'ajouter du style. Moins de cadres. Moins de boutons au meme niveau. Moins de formulaires visibles par defaut. Plus de photos, de hierarchie, de sections calmes, de gestes naturels.

Le produit doit donner l'impression d'un guide cafe vivant, personnel et premium. Pas d'une app qui expose toutes ses fonctionnalites en meme temps.

---

# Addendum apres lecture de la documentation projet

Source complementaire : `fragments_docs_md.zip`, 47 fichiers Markdown.

Docs principalement exploitees :

- `AGENTS.md`
- `docs/architecture/home-composition.md`
- `docs/architecture/floating-navigation.md`
- `docs/architecture/article-reading-flow.md`
- `docs/architecture/private-media.md`
- `docs/architecture/offline-readiness.md`
- `docs/quality/testflight-feedback-2026-09-14.md`
- `app/adapters/secondary/viewModel/README.md`
- `app/core-logic/contextWL/coffeeWl/README.md`
- `app/core-logic/contextWL/ticketWl/README.md`
- `app/core-logic/contextWL/commentWl/README.md`
- `app/core-logic/contextWL/userWl/README.md`

## Ce que la doc confirme

Les captures donnaient une lecture visuelle. La documentation confirme que Fragments est deja structure comme un vrai produit offline-first, avec une architecture mobile stricte :

```text
Screen
-> ViewModel hook
-> Redux selector / listener / thunk
-> Gateway port
-> Secondary adapter
-> Backend / native API
```

La reprise UI doit donc rester dans le bon niveau :

- les screens rendent les etats visuels ;
- les view models exposent les donnees et callbacks ;
- les screens ne doivent pas appeler de gateway, `fetch`, mapping DTO, logique offline, ACK ou retry ;
- les composants design ne doivent pas dupliquer les invariants metier.

Ce point change la maniere de prompter Codex : on ne demande pas seulement "ameliore l'UI", on demande une passe UI compatible avec les frontieres screens / view models / selectors / use cases.

## Contraintes produit a respecter

### Home

La Home n'est pas une source de verite. Elle compose des lectures deja possedees par `articleWl`, `coffeeWl`, `entitlementWl` et `experienceWl`.

Contraintes a conserver :

- hero editorial et bandeau au scroll restent la responsabilite de `MasterHeader` ;
- cinq cafes maximum dans un rail horizontal compact ;
- `Voir la carte` ouvre le parcours exhaustif ;
- prochaine etape derivee des entitlements serveur ;
- le besoin de ticket propose le scan ;
- trois experiences visibles maximum dans le rail ;
- `A lire ensuite` reste une liste verticale deterministe ;
- pas de fausse donnee lorsque la lecture est absente ;
- etat vide explicite avec destination.

Impact design :

On peut calmer et hierarchiser la Home, mais il ne faut pas transformer la composition en recommandation algorithmique ou en dashboard custom. Le travail est surtout presentation, espacement, cards, hierarchy, empty states et transitions.

### Carte

Le flux cafe reste :

```text
marker -> selected coffee id -> existing coffee read model -> compact sheet
       -> "Voir la fiche" or "Itineraire"
```

Contraintes a conserver :

- la sheet ne mappe pas de data backend dans le JSX ;
- elle recoit le view model existant ;
- elle montre un loading state si le snapshot est absent ;
- elle ne fait aucune ecriture ;
- la carte conserve son etat derriere la fiche detail ;
- retour depuis la fiche = region et selection restaurees ;
- directions = boundary native partagee.

Impact design :

La carte peut etre polish, mais le bottom sheet doit rester compact, clair, et non cerebral. C'est un preview, pas une fiche miniaturisee.

### Articles

Le mobile est un client de lecture editorial. Il ne genere, n'edite et ne publie pas d'articles. Le backend projection est source de verite ; Redux + cache durable rendent la lecture possible offline.

Impact design :

Les articles doivent etre traites comme un vrai contenu editorial : couverture, metadata, titre, introduction, blocs, conclusion, tags. Le point important n'est pas d'ajouter des widgets, mais d'ameliorer typographie, rythme, placeholders, erreurs et stale-cache.

### Images, avatars et experiences

Le mobile possede l'UX de selection et transfert resilient, mais le backend reste source de verite pour validation, ownership, normalisation et URLs publiques.

Contraintes importantes :

- selection image -> normalisation JPEG -> fichier durable app-owned ;
- Redux intent -> optimistic reducer -> outbox locale ;
- upload signe + confirmation ;
- reconciliation via `/commands/{commandId}` ;
- conservation locale jusqu'au remplacement par une URL serveur ou rejet terminal ;
- les cache URIs ne doivent jamais etre persistees dans l'outbox.

Impact design :

Les etats media doivent etre visibles :

- image locale en attente ;
- upload / synchronisation ;
- confirmation ;
- erreur retryable ;
- rejet terminal.

Un redesign qui masque ces etats affaiblirait le produit.

### Offline-first et outbox

La doc rappelle une regle fondamentale : pas de rollback sur reseau, timeout, offline, 5xx, auth transport, socket manque ou background. Le rollback ne vient que d'un rejet metier explicite.

Impact design :

L'UI doit assumer l'eventual consistency :

- etats "en cours de synchronisation" calmes ;
- actions optimistes lisibles ;
- retry non anxiogene ;
- pas de message d'erreur brutal pour un simple offline ;
- distinction claire entre "en attente" et "refuse".

### Pass

Le backend possede compteurs, seuils, niveaux et droits. Le mobile peut presenter les rings et textes derives du snapshot, mais ne doit pas dupliquer les seuils.

Impact design :

La passe Profil/Pass doit utiliser les composants partages et les snapshots `entitlementWl`, pas reconstruire un systeme de progression local dans les ecrans.

## Ajustement des priorites apres lecture docs

Les priorites visuelles restent valides, mais l'ordre d'execution doit etre plus architecture-aware :

1. Stabiliser les primitives visuelles sans toucher aux contracts.
2. Traiter la Home en respectant `homeContentViewModel` et `MasterHeader`.
3. Traiter carte + sheet en respectant le flow `selected coffee id -> read model -> compact sheet`.
4. Traiter fiche cafe via composants de presentation, sans logique de mapping dans JSX.
5. Traiter experiences/media avec tous les etats outbox et image durable.
6. Traiter profil/pass en respectant le snapshot entitlements et les composants rings partages.
7. Traiter scan ticket en gardant le cycle `CAPTURED -> ANALYZING -> CONFIRMED/REJECTED`.

## Plan de PR recommande apres lecture docs

### PR 1 - Design foundations sans changement produit

Scope :

- tokens couleurs ;
- typographie ;
- espaceurs ;
- boutons ;
- cards ;
- section headers ;
- surfaces ;
- tab bar clearance ;
- bottom sheet primitives ;
- empty/loading/error/stale states.

Contraintes :

- aucun changement backend ;
- aucun nouveau flux Redux ;
- aucun mapping DTO dans les screens ;
- aucune duplication de seuil Pass ;
- tests visuels/manuels + tests existants.

### PR 2 - Golden path presentation

Scope :

- Home sous `MasterHeader` ;
- rail cafes compact ;
- prochaine etape ;
- rail experiences ;
- `A lire ensuite` ;
- carte + compact sheet ;
- fiche cafe en presentation plus claire.

Contraintes :

- conserver les limites Home documentees : 5 cafes, 3 experiences, articles deterministes ;
- conserver `Voir la carte` comme destination exhaustive ;
- conserver la sheet comme preview.

### PR 3 - Contribution, media et eventual consistency

Scope :

- experience empty state ;
- creation/modification experience ;
- photo locale en attente ;
- etats synchronisation/retry/rejet ;
- commentaires ;
- scan ticket.

Contraintes :

- respecter outbox ;
- ne pas rollback sur offline ;
- ne pas masquer les etats locaux ;
- garder les actions destructrices confirmees.

### PR 4 - Profil, Pass et settings

Scope :

- Profil ;
- Pass ;
- Tickets ;
- Favoris ;
- Mes experiences ;
- Parametres.

Contraintes :

- respecter entitlements snapshot ;
- utiliser composant partage Pass avatar/rings ;
- actions destructrices discretes mais accessibles ;
- pas de seuils hardcodes dans les screens.

## Prompt Codex renforce par la documentation

Tu travailles sur `fragmentsCleanFront`, app React Native / Expo offline-first.

Objectif : appliquer la passe UI/UX Fragments Design 2026 sans casser les frontieres d'architecture.

Lis obligatoirement :

- `AGENTS.md`
- `.agents/iteration-workflow.md`
- `docs/architecture/home-composition.md`
- `docs/architecture/floating-navigation.md`
- `docs/architecture/article-reading-flow.md`
- `docs/architecture/private-media.md`
- `docs/architecture/offline-readiness.md`
- `app/adapters/secondary/viewModel/README.md`
- les README des contexts touches.

Contraintes d'architecture :

- Screen -> ViewModel -> Redux selector/listener/thunk -> Gateway port -> adapter.
- Les screens rendent UI + etats visuels et appellent des callbacks de view model.
- Pas de `fetch` dans les screens.
- Pas de gateway concrete dans screen ou view model.
- Pas de mapping DTO backend en JSX.
- Pas de logique offline/retry/ACK dans les composants.
- Pas de duplication des seuils Pass.
- Pas de rollback UI sur simple panne reseau.

Contraintes design :

- garder l'identite dark cafe / brun / orange ;
- viser sobriete Apple-like : moins de bruit, plus de hierarchie ;
- ne pas transformer Fragments en dashboard SaaS ;
- privilegier photos, cafes, experiences, articles ;
- unifier les composants plutot que restyler chaque ecran a la main ;
- verifier que la floating tab bar ne masque pas les CTA ;
- traiter clavier, safe areas, empty/loading/error/offline/stale states.

Ordre de travail :

1. Stabiliser les primitives design.
2. Appliquer au golden path `Home -> Carte -> Bottom sheet -> Fiche cafe -> Experience`.
3. Garder la Home read-only et deterministe.
4. Garder la sheet carte compacte et alimentee par le read model.
5. Garder les etats outbox/media visibles pour experiences, tickets, profil.
6. Lancer les tests pertinents et fournir captures avant/apres.

Definition of done :

- aucun contrat backend modifie ;
- aucun contournement architecture ;
- TypeScript vert ;
- tests existants verts ou justification claire ;
- screenshots iPhone avant/apres ;
- verification tab bar / clavier / grande taille de texte / offline ou stale state quand applicable.
