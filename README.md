# Fragments Clean Front

Fragments Clean Front is the mobile client for the Fragments experience, built with Expo and React Native. The app lets users explore curated coffee places, browse tours, and manage their profile while relying on device capabilities such as geolocation, camera access, secure storage, and offline-first flows.

## Tech stack
- **Expo 54 / React Native 0.81** for a single code base that runs on iOS, Android, and the web.
- **Expo Router** for file-system based navigation and nested layouts.
- **TypeScript** to enforce type-safety across components and use cases.
- **Redux Toolkit** and feature-specific contexts (`contextWL`) to coordinate state, side effects, and background listeners.
- **React Native Maps, Secure Store, Image Picker, OCR, and Location** integrations exposed through dedicated gateways in the clean architecture layer.

## Architecture at a glance
The project follows a clean architecture approach with clearly identified boundaries:

| Layer / Folder | Responsibility |
| --- | --- |
| `app/core-logic` | Domain use cases and gateway contracts to interact with device services or remote APIs. |
| `app/contextWL` | Workload contexts orchestrating the domain logic (comments, likes, location, tickets, etc.) and exposing hooks/actions to the UI. |
| `app/adapters` | Primary adapters (React components) and secondary adapters (view models, presenters) that translate between UI and domain. |
| `app/store` | Redux Toolkit stores and middleware wiring the WL contexts to the application state. |
| `components/` | Shared UI building blocks (parallax scroll, themed text/views, haptic tabs, etc.). |
| `hooks/` | Reusable hooks to access fragments, tickets, and other pieces of domain state. |
| `assets/` | Images and other static resources bundled with the application. |

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the Expo development server**
   ```bash
   npm run start
   ```
   Choose the platform you want to run on (Expo Go, iOS simulator, Android emulator, or the web). For geolocation-driven screens such as the coffee map, run on a device or simulator with location services enabled.

3. **Platform-specific commands**
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Quality checks
- **Unit tests**: `npm test` runs the Jest suite. You can target a specific feature, for example `npm test -- userLocationFactory.spec.ts` to execute the WL location listener tests.
- **Linting**: `npm run lint` verifies code style and common pitfalls using the Expo ESLint config.

Run these commands before opening a pull request to keep the project healthy.

## Development workflow
1. Create a branch for your change (`git checkout -b feature/my-feature`).
2. Implement the feature within the appropriate layer (domain use case, context, adapter, UI component).
3. Add or update tests close to the affected module.
4. Run linting and unit tests locally.
5. Commit with a descriptive message and open a pull request for review.

## Helpful scripts
- `npm run reset-project`: move the current sample screens under `app-example/` and scaffold an empty `app/` directory if you need a fresh start.

For more details on Expo-specific tooling, refer to the [Expo documentation](https://docs.expo.dev/). If you add new integrations (camera, sensors, auth providers, etc.), implement the gateway in `app/core-logic`, orchestrate it through a context in `app/contextWL`, and surface it to the UI with an adapter to keep the clean architecture intact.
