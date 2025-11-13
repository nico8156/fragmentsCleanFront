# Adaptateur React (Primary)

La couche "primary" est responsable de la présentation (écrans Expo + React Navigation) et des intentions UI envoyées aux bounded contexts.

## Navigation & bootstrap

- `navigation/RootNavigator.tsx` structure l'app : un stack racine avec un tab navigator (Home/Map/Rewards/Profile) + des écrans empilés (`CafeDetails`, `Article`, `ScanTicketModal`, `Search`). La navigation dépend de `selectAuthStatus` pour basculer entre les flux "signed in" et "signed out".【F:app/adapters/primary/react/navigation/RootNavigator.tsx†L1-L87】【F:app/adapters/primary/react/navigation/RootNavigator.tsx†L88-L147】
- `components/AppInitializer.ts` déclenche les use cases critiques au montage (auth init, permissions/position, hydrations cafés/photos/horaires) afin d'amorcer les contexts côté Redux.【F:app/adapters/primary/react/components/appInitializer.ts†L1-L22】

## Features

Chaque dossier `features/<domain>/screens` consomme les view models exposés par `app/adapters/secondary/viewModel` et déclenche les intentions UI :

- `features/home/screens/HomeScreen.tsx` combine `useArticlesHome` avec des composants maison pour afficher le slider, les catégories et les actions (Search, Scan).【F:app/adapters/primary/react/features/home/screens/HomeScreen.tsx†L1-L71】
- `features/map/screens/MapScreen.tsx` assemble la carte, les marqueurs et la bottom sheet autour de `useCafeForMarkers`, `useUserLocationFromStore`, `useCafeFull` pour refléter la projection domain-driven sur l'UI.【F:app/adapters/primary/react/features/map/screens/MapScreen.tsx†L1-L44】
- `features/auth/screens/LoginScreen.tsx` pilote `signInWithProvider` / `initializeAuth` pour déclencher les actions auth.`

Chaque feature se limite à la présentation (styles RN, gestuelles) et délègue toute logique métier aux view models/hooks.

## Styles & thèmes

Les styles partagés (`css/colors.ts`) définissent la palette utilisée par les composants (headers, bottom sheets, boutons) et sont injectés dans les écrans via `StyleSheet` ou React Navigation (`theme` custom dans `RootNavigator`).【F:app/adapters/primary/react/navigation/RootNavigator.tsx†L20-L63】
