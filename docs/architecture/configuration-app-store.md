# Configuration and App Store

## API Configuration

`app.config.js` is the sole Expo configuration source. The checked-in `ios/`
and `android/` projects are generated from it in production mode; modifying a
native plist or manifest by hand is forbidden.

Production API URLs must come from EAS environment variables.

No production API URL should be hardcoded in source files.

Allowed:
- `EXPO_PUBLIC_API_BASE_URL` for non-secret API base URL
- EAS secrets for sensitive build-time values
- SecureStore for runtime auth/session

Forbidden:
- secrets in Expo configuration
- tokens in logs
- LAN IP as production config
- gateway-specific hidden `Constants.expoConfig` reads

## App Store Readiness

Before submission:
- bundle id is `com.nico8156.fragments` on iOS and Android
- app name is `Fragments`
- `fragments://` and the Google redirect scheme are declared by the native binary
- location permission text is accurate and foreground-only
- camera permission is used only for ticket OCR
- no background location, microphone, Face ID, or photo-library permission
- privacy manifest and permission strings match actual behavior
- production build uses HTTPS API
