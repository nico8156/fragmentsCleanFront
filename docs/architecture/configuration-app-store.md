# Configuration and App Store

## API Configuration

Production API URLs must come from EAS environment/secrets.

No production API URL should be hardcoded in source files.

Allowed:
- `EXPO_PUBLIC_API_BASE_URL` for non-secret API base URL
- EAS secrets for sensitive build-time values
- SecureStore for runtime auth/session

Forbidden:
- secrets in `app.json`
- tokens in logs
- LAN IP as production config
- gateway-specific hidden `Constants.expoConfig` reads

## App Store Readiness

Before submission:
- bundle id is production-ready
- app name is public-facing
- location permission text is accurate
- no unnecessary background location
- privacy manifest and permission strings match actual behavior
- production build uses HTTPS API

