# Fragments App Store / EAS Runbook

This runbook connects the mobile production build to the AWS backend deployment.

## Required Backend State

Before building the App Store binary:

- backend staging/prod is reachable over HTTPS;
- `GET /actuator/health` returns `200`;
- public read APIs used by the app respond over the same host;
- command reconciliation works through `/commands/{commandId}`;
- projection freshness works through SSE projection sync and GET snapshots;
- backend CORS/security policy accepts the mobile app flows;
- Google OAuth redirect/client configuration matches the production bundle.

## EAS Configuration

Production builds must receive public runtime configuration from EAS environment
variables. These values are not backend secrets, but they must still be owned by
the build environment instead of being hardcoded in gateways:

```bash
npx eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value https://<production-api-host> \
  --visibility plaintext

npx eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID \
  --value <google-ios-client-id>.apps.googleusercontent.com \
  --visibility plaintext

npx eas env:create production \
  --scope project \
  --name EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI \
  --value com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect \
  --visibility plaintext
```

Use the staging host only in the `development` or `preview` EAS environment.
An App Store binary must target the production HTTPS host.

`app.config.js` intentionally fails production builds when one of the API or
Google OAuth values is missing. It is the unique Expo configuration source.
Before a native configuration change is submitted, regenerate the checked-in
native projects in production mode:

```bash
EAS_BUILD_PROFILE=production \
EXPO_PUBLIC_API_BASE_URL=https://<production-api-host> \
EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID=<google-ios-client-id>.apps.googleusercontent.com \
EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI=<google-redirect-uri> \
  npx expo prebuild --clean --no-install
```

The local `withPrivacyMinimum` config plugin keeps only the permissions used by
the product: foreground location and camera ticket OCR. Do not reintroduce
background location, microphone, Face ID, or photo-library declarations without
an approved product and privacy change.

Because the generated native projects are checked in, every release must also
run the regression guard after prebuild:

```bash
npm run native:release:check
```

## Local Verification

```bash
npm test
EXPO_PUBLIC_API_BASE_URL=https://<production-api-host> \
EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID=<google-ios-client-id>.apps.googleusercontent.com \
EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI=com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect \
  EAS_BUILD_PROFILE=production \
  npx expo config --type public
```

Confirm in the generated config:

- `extra.apiBaseUrl` is the HTTPS AWS URL;
- `ios.bundleIdentifier` is `com.nico8156.fragments`;
- `extra.googleMobileIosRedirectUri` is `com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect`;
- `scheme` includes `fragments` and the Google redirect scheme;
- iOS and Android both use `com.nico8156.fragments`;
- Android only requests foreground location and camera;
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
- camera usage is declared as ticket OCR; no background location capability is
  declared.

## Runtime Smoke Scenario

Use the production build against AWS and verify:

1. launch app offline;
2. like or unlike a target;
3. reconnect;
4. backend returns `202`;
5. no socket ACK is required;
6. polling `/commands/{commandId}` resolves the command;
7. local outbox drops the command only after `APPLIED`;
8. rollback only occurs on explicit business rejection.
9. scan a ticket: submission is unavailable until OCR finishes; switch offline,
   submit, restart the app, reconnect, and verify command reconciliation.

## Guardrails

- Do not hardcode production API URLs in gateways.
- Do not put backend secrets in Expo config.
- Do not treat SSE as command ACK; it only signals projection freshness.
- Do not submit an App Store build pointing to localhost, LAN, ngrok, or HTTP.
