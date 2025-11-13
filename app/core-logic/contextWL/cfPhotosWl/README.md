# Coffee Photos Context (WL)

Cette slice stocke les URLs des photos crowdsourcées pour chaque café.

- `typeAction/cfPhoto.type.ts` décrit l'état minimal `byCoffeeId` ainsi que la forme `PhotoURI` renvoyée par le gateway.【F:app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.type.ts†L1-L8】
- `cfPhoto.reducer.ts` fusionne les réponses en garantissant l'unicité de chaque `photo_uri` par café via `photosHydrated`.【F:app/core-logic/contextWL/cfPhotosWl/reducer/cfPhoto.reducer.ts†L1-L21】
- `onCfPhotoRetrieval` interroge `gateways.cfPhotos.getAllphotos()` et retombe sur un payload vide en cas d'erreur réseau pour garder un état cohérent.【F:app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval.ts†L1-L23】
- `selectPhotosForCoffeeId` expose un sélecteur trivial utilisé par la fiche café pour afficher le carrousel.【F:app/core-logic/contextWL/cfPhotosWl/selector/cfPhoto.selector.ts†L1-L4】

Voir `cfPhotosFlow.mmd` pour la propagation UI → gateway → reducer → écran.
