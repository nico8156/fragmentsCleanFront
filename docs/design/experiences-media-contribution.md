# Expériences, médias, contribution

**PR2 VALIDÉE par l’utilisateur dans la conversation**, après confirmation que « Options » est présent sur l’appareil. Cette décision clôt la revue ; les limites des captures archivées restent documentées ci-dessous.

5 octobre 2026. Ordre demandé : **expériences → médias → contribution**. Suite visuelle de la [fiche café](cafe-detail-premium.md), fondée sur l’[audit Design 2026](fragments_design_2026_audit.md).

## 1. Expériences

`MyExperienceCard` est extrait du screen pour isoler la présentation. Cards sans bordure, nom du café complet, typographie PR1 et statut textuel : Brouillon, Synchronisation…, Publiée, Masquée. Le view model existant reste la source de ces libellés.

`ExperienceActionsMenu` regroupe les outils derrière « Options ». Il sert aux expériences de la fiche café et à Mes expériences. Les callbacks et confirmations existants sont conservés ; publier un brouillon reste directement accessible. Les informations de synchronisation restent visibles quand le menu est replié.

## 2. Médias

L’aperçu standard adopte un ratio 4:3 adapté à la largeur ; le format compact Home conserve ses 108 points. URI locale, clé de cache distante par mediaId, cache disque et fallback d’erreur sont inchangés.

Dans Mes expériences, ajout/suppression de photo rejoignent les options ; la suppression conserve sa confirmation. Le message de photo en attente et les erreurs de préparation restent hors du menu. Cette passe ne change ni picker, ni normalisation, ni upload, ni retry/rejet/outbox. Sur la fiche café, « Supprimer la photo » est également rangé dans Options ; son callback reste inchangé.

## 3. Contribution

`ExperienceComposer` présente le formulaire existant : champ de visite, ajout de photo secondaire, aperçu local compact de 144 × 108 points maximum (largeur limitée à celle du conteneur), publication primaire puis brouillon tertiaire. Le parent conserve la saisie, la photo, la disponibilité des boutons et les callbacks du view model. Le repli conserve le brouillon et la photo ; il ne déclenche aucune commande.

Aucune modification des contrats backend, reducers, gateways ou view models. Aucune logique métier, aucun fetch et aucun mapping DTO ajoutés aux screens. La structure générale de la fiche café reste celle validée précédemment. Scan, Pass et autres écrans profil restent hors périmètre.

## Compromis et preuves

Les outils de gestion demandent une ouverture du menu. Les statuts restent textuels et les photos occupent davantage de hauteur. Les informations d’attente ne sont jamais déplacées dans le menu.

Itération **CHORE visuel / REFACTORING de présentation**, route **Read Feature**. Référence verte avant extraction : **5 suites / 19 tests** (view models, reducer, listener expériences, suppression/outbox). Mutations métier : **NOT APPLICABLE** ; aucun changement des décisions métier ni RED artificiel.

Tests de présentation ajoutés : visibilité des options, titre long, édition, confirmation de suppression expérience/photo, statut des brouillons/publications/masquage/synchronisation, pending média visible, cache local/distant, fallback d’image, format compact Home, délégation des actions de contribution et disponibilité des boutons. Mocks uniquement aux frontières de rendu natives, pas de view model ou port métier mocké.

Validation automatique : suite complète **99 suites / 398 tests PASS** ; TypeScript, lint et `git diff --check` **PASS**.

Rendu natif : **REVIEW**. Aucun simulateur iPhone disponible dans cet environnement ; aucune capture après fabriquée. À vérifier sur appareil : lecture d’une expérience longue, options ouvertes/fermées, brouillon/publiée/photo en attente, sélection locale et aperçu indisponible, repli avec texte/photo, clavier et grande police. Les tests de renderer ne remplacent pas cette recette.

## Corrections ciblées PR2 — revue visuelle

Statut maintenu : **REVIEW visuel**. Structure, données et décisions métier inchangées.

- Fiche café : Modifier, Supprimer et Supprimer la photo sont absents quand Options est fermé. Messages pending média et erreur média restent hors menu.
- Mes expériences : déjà conforme pour ces trois actions. Vérification ajoutée sur quatre cards (brouillon, synchronisation, publiée, masquée) : chaque menu reste indépendant et seul le brouillon expose Publier comme action primaire. Une erreur de préparation reste visible après fermeture d’Options.
- Composer : aperçu **compact**, 144 points de large au maximum, ratio 4:3, rayon existant conservé. Cette décision remplace l’annonce précédente de pleine largeur. Aucun changement de fichier local, de cache ou de cycle d’envoi.

Preuve de reproduction : nouveau test de card publique exécuté avant correction, **1 échec / 9 réussites** ; échec précisément sur « Supprimer la photo » encore visible menu fermé. Après correction : **5 suites / 28 tests PASS**, TypeScript et lint ciblé **PASS**. Retouche de présentation, mutation métier non applicable. Les tests rendent les vrais composants avec frontières natives mockées ; aucun view model ou port métier mocké.

### Captures après correction — attendues (lot reçu antérieur aux corrections)

| Capture iPhone | État |
| --- | --- |
| Fiche café avec expérience, Options fermé | À fournir |
| Fiche café, Options ouvert | À fournir |
| Expérience avec média en attente | À fournir |
| Mes expériences, plusieurs cards, Options fermés | À fournir |
| Mes expériences, Options ouvert sur une card | À fournir |
| Brouillon, Publier visible | À fournir |

Les tests multicards contrôlent la présence des textes et commandes, pas leur rendu UIKit. Les captures natives ne sont pas produites dans cet environnement dépourvu de Xcode/simulateur et d’outil de capture sur appareil. Le lot `assets/screens_PR2` reçu ensuite est inspecté ci-dessous ; il montre un rendu antérieur aux corrections et ne valide pas leur résultat.

## Revue des captures `screens_PR2`

Les **20 captures IMG_5457 à IMG_5476**, 1170 × 2532 pixels, ont été inspectées. Elles affichent des heures entre 12:07 et 12:11. Modèle d’iPhone, version iOS, réglage Dynamic Type et build/commit exécuté non renseignés. Originaux conservés sans retouche.

**Conclusion : REVIEW maintenu. Le rendu photographié est antérieur aux corrections Options/commentaires/composer présentes dans le workspace.** Ce constat repose sur les composants visibles, pas sur la date de copie des fichiers. La cause côté application chargée (ancien bundle, autre serveur ou autre build) ne peut pas être déterminée à partir des images.

| Cas | Preuve reçue | Conclusion |
| --- | --- | --- |
| Haut de fiche | [Nuage IMG_5457](../../assets/screens_PR2/IMG_5457.PNG), [Bourbon IMG_5460](../../assets/screens_PR2/IMG_5460.PNG) | Photo valorisée, statut discret ; nom long Bourbon lisible sur deux lignes. Grande police/petit écran non attestés. |
| Expérience sur fiche | [IMG_5458](../../assets/screens_PR2/IMG_5458.PNG) | Modifier, Supprimer et Supprimer la photo sont tous visibles, aucun Options : ancienne présentation. |
| Informations/commentaires | [IMG_5459](../../assets/screens_PR2/IMG_5459.PNG), [IMG_5461](../../assets/screens_PR2/IMG_5461.PNG), [IMG_5462](../../assets/screens_PR2/IMG_5462.PNG), [IMG_5469](../../assets/screens_PR2/IMG_5469.PNG) | Hiérarchie lisible ; anciens boutons auteur en capsules encore présents. Horaires repliés, aucun clavier visible. |
| Formulaire ouvert | [IMG_5463](../../assets/screens_PR2/IMG_5463.PNG) | Ancien placeholder et ancienne disposition des commandes. |
| Photo locale/saisie | [IMG_5464](../../assets/screens_PR2/IMG_5464.PNG), [IMG_5465](../../assets/screens_PR2/IMG_5465.PNG), [IMG_5466](../../assets/screens_PR2/IMG_5466.PNG) | Aperçu compact visible, mais carré et ancien formulaire : ne valide pas le nouveau 144 × 108. |
| Pending média sur fiche | [IMG_5467](../../assets/screens_PR2/IMG_5467.PNG), [IMG_5468](../../assets/screens_PR2/IMG_5468.PNG) | Envoi et attente média bien visibles ; gestion encore dépliée. Formulaire ouvert puis replié observable. |
| Liste Mes expériences | [IMG_5470](../../assets/screens_PR2/IMG_5470.PNG), [IMG_5471](../../assets/screens_PR2/IMG_5471.PNG), [IMG_5472](../../assets/screens_PR2/IMG_5472.PNG) | Plusieurs visites présentes, mais anciennes bordures et grands boutons rouges, aucun Options. La tab bar passe devant le contenu intermédiaire. |
| Publier | [IMG_5473](../../assets/screens_PR2/IMG_5473.PNG) | Action primaire visible avec statut Synchronisation… ; libellé Brouillon non photographié. Ancienne présentation. |
| Attente puis publication | [IMG_5474](../../assets/screens_PR2/IMG_5474.PNG), [IMG_5475](../../assets/screens_PR2/IMG_5475.PNG), [IMG_5476](../../assets/screens_PR2/IMG_5476.PNG) | Statut d’attente puis Publiée visible ; ne prouve pas à lui seul le transport/ACK. Gestion toujours dépliée. |

Aucune image ne montre Options ouvert ou fermé. Le nom long, les états pending et les grandes photos sont documentés ; les corrections récentes ne le sont pas encore. Pas de nouveau changement UI déclenché par ces images anciennes, pas de nouvelle exécution des tests pour cette revue documentaire.

Pour la prochaine prise : charger le JavaScript actuel dans le development build depuis ce workspace (`npm run start:clean` si nécessaire), puis vérifier **Options** avant de refaire les six captures attendues. Le formulaire actuel comporte « Ta visite », puis « Le café, l’ambiance, un détail à partager… ». Ces repères permettent de vérifier la version visuelle avant la recette. Ajouter au relevé le build exécuté et le réglage de taille de texte.
