# Fragments App Store / EAS Runbook

This runbook connects the mobile production build to the AWS backend deployment.

## Required Backend State

Before building the App Store binary:

- backend staging/prod is reachable over HTTPS;
- `GET /actuator/health` returns `200`;
- public read APIs used by the app respond over the same host;
- WebSocket may be available, but command reconciliation must work through `/commands/{commandId}`;
- backend CORS/security policy accepts the mobile app flows;
- Google OAuth redirect/client configuration matches the production bundle.

## EAS Configuration

Production builds must receive the API URL from EAS environment/secrets:

```bash
eas secret:create \
  --scope project \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value https://api-staging.fragments.example
```

`app.config.js` intentionally fails production builds when `EXPO_PUBLIC_API_BASE_URL` is missing.

## Local Verification

```bash
npm test
EXPO_PUBLIC_API_BASE_URL=https://api-staging.fragments.example \
  EAS_BUILD_PROFILE=production \
  npx expo config --type public
```

Confirm in the generated config:

- `extra.apiBaseUrl` is the HTTPS AWS URL;
- `ios.bundleIdentifier` is `com.nico8156.fragments`;
- Android only requests foreground location;
- no API secret is present in `extra`.

## iOS Build

```bash
npx eas build --profile production --platform ios
```

For a clean build:

```bash
npx eas build --profile production --platform ios --clear-cache
```

## App Store Submission

```bash
npx eas submit --profile production --platform ios
```

Before submission, verify App Store Connect metadata:

- location usage description matches the app behavior;
- no background location claim;
- privacy questionnaire mentions location and account/auth data accurately;
- screenshots show the production app, not local/demo data;
- Google Sign-In works on the production bundle identifier.

## Runtime Smoke Scenario

Use the production build against AWS and verify:

1. launch app offline;
2. like or unlike a target;
3. reconnect;
4. backend returns `202`;
5. no WebSocket ACK is required;
6. polling `/commands/{commandId}` resolves the command;
7. local outbox drops the command only after `APPLIED`;
8. rollback only occurs on explicit business rejection.

## Guardrails

- Do not hardcode production API URLs in gateways.
- Do not put backend secrets in Expo config.
- Do not treat WebSocket ACK as source of truth.
- Do not submit an App Store build pointing to localhost, LAN, ngrok, or HTTP.
