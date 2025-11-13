# User/Auth Context (WL)

Encapsule l'état d'authentification (session OAuth, utilisateur courant, erreurs) et les interactions avec les gateways sécurisées.

- `typeAction/user.type.ts` décrit l'ensemble des value objects (`UserId`, `OAuthProfile`), la session (`AuthSession`) et l'état `AuthState` consommé par React Navigation.【F:app/core-logic/contextWL/userWl/typeAction/user.type.ts†L1-L68】【F:app/core-logic/contextWL/userWl/typeAction/user.type.ts†L94-L138】
- `authReducer` pilote les transitions `loading/signedIn/signedOut/error`, stocke la session snapshotée et fusionne `currentUser` via `mergeUser`.【F:app/core-logic/contextWL/userWl/reducer/user.reducer.ts†L1-L63】【F:app/core-logic/contextWL/userWl/reducer/user.reducer.ts†L64-L97】
- `authListenerFactory` connecte les gateways (`secureStore`, `oauth`, `userRepo`, `server`) pour charger la session persistée, lancer un sign-in, rafraîchir les tokens à T-5min, hydrater le profil et gérer le sign-out/clear store.【F:app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory.ts†L1-L74】【F:app/core-logic/contextWL/userWl/usecases/auth/authListenersFactory.ts†L74-L170】
- Les thunks `initializeAuth`, `signInWithProvider`, `refreshUser`, `signOut` dispatchent les intentions UI de manière explicite et testable.【F:app/core-logic/contextWL/userWl/usecases/auth/authUsecases.ts†L1-L26】

`userFlow.mmd` met en avant la boucle session ↔ gateways ↔ reducer.
