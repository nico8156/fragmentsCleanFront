# Article Context (WL)

Ce contexte fournit le read-model éditorial (articles, sliders, catégories) consommé par la Home et les écrans de lecture.

- **Modèle** : `typeAction/article.type.ts` définit les value objects (`ArticleId`, `Slug`, `Locale`), la structure `Article` (bloc riche + métadonnées) et les caches par locale (`listsByLocale`).【F:app/core-logic/contextWL/articleWl/typeAction/article.type.ts†L1-L64】【F:app/core-logic/contextWL/articleWl/typeAction/article.type.ts†L65-L98】
- **Réducteur** : `articleWl.reducer.ts` gère les requêtes ponctuelles (`articleRequested`) et les listes paginées en veillant à fusionner les entités, maintenir `bySlug` et mémoriser `status/errors` par référence.【F:app/core-logic/contextWL/articleWl/reducer/articleWl.reducer.ts†L1-L82】【F:app/core-logic/contextWL/articleWl/reducer/articleWl.reducer.ts†L83-L138】
- **Use cases** : `articleRetrieval.ts` expose deux thunks (`articleRetrievalBySlug`, `articlesListRetrieval`) qui dispatchent `articleRequested`/`articleListRequested`, interrogent `gateways.articles` puis publient `articleReceived` ou les erreurs correspondantes.【F:app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval.ts†L1-L61】【F:app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval.ts†L62-L94】
- **Sélecteurs/View models** : `selectArticlesForLocale` alimente `useArticlesHome`, lequel construit les sliders et catégories pour la Home tout en relançant la récupération lorsque `status` revient à `IDLE`.【F:app/adapters/secondary/viewModel/useArticlesHome.ts†L1-L66】【F:app/adapters/secondary/viewModel/useArticlesHome.ts†L67-L113】

## Flux standard

`articleFlow.mmd` illustre la séquence : intention UI → thunk → gateway → reducer → view model. Le diagramme récapitule également la mise à jour des caches par locale.
