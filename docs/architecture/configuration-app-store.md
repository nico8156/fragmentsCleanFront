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

Crash reporting is the sole exception to the general absence of telemetry. It
uses `@sentry/react-native` behind the observability adapter. Production builds
fail closed unless the public DSN, organization/project and secret source-map
upload token are available from EAS. The token is never copied into Expo
`extra`; tracing and replay are disabled, and the event sanitizer removes user,
request, breadcrumb and arbitrary extra fields.

## App Store Readiness

Before submission:
- bundle id is `com.nico8156.fragments` on iOS and Android
- app name is `Fragments`
- `fragments://` and the Google redirect scheme are declared by the native binary
- location permission text is accurate and foreground-only
- camera permission is used only for ticket OCR
- no background location, microphone or Face ID permission; selected-photo
  access has a precise photo-library purpose string
- privacy manifest and permission strings match actual behavior
- production build uses HTTPS API
- exact signed IPA passes `npm run native:ipa:inspect`
- EAS logs prove symbol/source-map upload and a TestFlight diagnostic is
  symbolicated before App Store submission
