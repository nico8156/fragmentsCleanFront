# Fragments Clean Front

Ce dépôt regroupe le client mobile Fragments (Expo + React Native). La navigation a été repensée autour de **React Navigation v6** pour gagner en clarté, modularité et testabilité.

## Architecture navigation & features

```
src/
 ├─ navigation/
 │   ├─ RootNavigator.tsx       # NavigationContainer + stacks/tabs
 │   └─ types.ts                # RootStackParamList & RootTabsParamList typés
 └─ features/
     ├─ home/                   # Ecran Home + composants dédiés
     ├─ map/                    # Carte + liste des cafés
     ├─ cafes/                  # Détails café (Stack)
     ├─ articles/               # Lecture d’articles
     ├─ rewards/                # Passeport/badges/avantages
     ├─ profile/                # Profil + déconnexion
     └─ scan/                   # Modal de scan ticket (OCR)
```

Chaque “feature” expose ses écrans et composants, et consomme les view models existants dans `app/adapters`. Les types de navigation (`RootStackParamList`, `RootTabsParamList`) verrouillent `navigation.navigate` et `route.params` sur l’ensemble du projet.

## Deep linking & modals
- `fragments://coffee/:id` ouvre directement l’écran `CafeDetails`.
- Le bouton flottant « Scanner » (Home/Map/Rewards) déclenche le modal `ScanTicketModal` et dispatche `uiTicketSubmitRequested` après OCR.
- `CafeDetails` et `Article` sont empilés par-dessus les tabs pour conserver la barre inférieure.

## Démarrer le projet
```bash
npm install
npm run start
```

Tests & lint :
```bash
npm test
npm run lint
```

Cette structure garde la clean architecture existante (`app/core-logic`, `app/store`, gateways…) tout en offrant des écrans clairement séparés par feature et une navigation typée, plus simple à étendre.
