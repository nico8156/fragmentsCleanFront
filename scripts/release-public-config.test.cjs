const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const withPrivacyMinimum = require("../plugins/withPrivacyMinimum");

test("the real privacy plugin preserves selected-photo access while removing unused permissions", async () => {
  const config = withPrivacyMinimum({ name: "Fragments test", slug: "fragments-test" });
  const result = await config.mods.ios.infoPlist({
    ...config,
    modRequest: { platform: "ios", modName: "infoPlist" },
    modResults: {
      NSPhotoLibraryUsageDescription: "Photos choisies pour mon profil",
      NSCameraUsageDescription: "Tickets et photos",
      NSMicrophoneUsageDescription: "Unused",
      NSLocationAlwaysUsageDescription: "Unused",
      UIBackgroundModes: ["location"],
    },
  });
  assert.deepEqual(result.modResults, {
    NSPhotoLibraryUsageDescription: "Photos choisies pour mon profil",
    NSCameraUsageDescription: "Tickets et photos",
  });
});

const production = {
  EAS_BUILD_PROFILE: "production",
  EXPO_PUBLIC_API_BASE_URL: "https://api.example.invalid",
  EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID: "test-client",
  EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI: "test-scheme:/oauthredirect",
  EXPO_PUBLIC_SUPPORT_EMAIL: "support@example.invalid",
  EXPO_PUBLIC_SENTRY_DSN: "https://public-key@errors.example.invalid/42",
  SENTRY_ORG: "fragments-test",
  SENTRY_PROJECT: "fragments-mobile-test",
};
function load(extra = {}) {
  return spawnSync(process.execPath, ["-e", 'const c=require("./app.config.js");process.stdout.write(JSON.stringify(c.expo.extra))'], {
    cwd: path.dirname(require.resolve("../app.config.js")), env: { ...production, ...extra }, encoding: "utf8",
  });
}

test("production fails closed without both published legal URLs", () => {
  assert.notEqual(load().status, 0);
  assert.notEqual(load({ EXPO_PUBLIC_PRIVACY_POLICY_URL: "https://example.invalid/privacy" }).status, 0);
});

test("production rejects insecure URLs and embedded credentials", () => {
  for (const value of ["http://example.invalid/privacy", "https://user:secret@example.invalid/privacy", "not-a-url"]) {
    assert.notEqual(load({ EXPO_PUBLIC_PRIVACY_POLICY_URL: value, EXPO_PUBLIC_TERMS_URL: "https://example.invalid/terms" }).status, 0);
  }
});

test("public URLs are exposed to the app when production configuration is complete", () => {
  const result = load({ EXPO_PUBLIC_PRIVACY_POLICY_URL: "https://example.invalid/privacy", EXPO_PUBLIC_TERMS_URL: "https://example.invalid/terms" });
  assert.equal(result.status, 0, result.stderr);
  const extra = JSON.parse(result.stdout);
  assert.equal(extra.privacyPolicyUrl, "https://example.invalid/privacy");
  assert.equal(extra.termsUrl, "https://example.invalid/terms");
  assert.equal(extra.sentryDsn, "https://public-key@errors.example.invalid/42");
  assert.equal(extra.sentryAuthToken, undefined);
  assert.equal(extra.sentryOrg, undefined);
  assert.equal(extra.sentryProject, undefined);
});

test("production fails closed without its public symbolication coordinates", () => {
  for (const missing of ["EXPO_PUBLIC_SENTRY_DSN", "SENTRY_ORG", "SENTRY_PROJECT"]) {
    assert.notEqual(load({
      EXPO_PUBLIC_PRIVACY_POLICY_URL: "https://example.invalid/privacy",
      EXPO_PUBLIC_TERMS_URL: "https://example.invalid/terms",
      [missing]: "",
    }).status, 0, missing);
  }
});

test("production config does not require or expose the build-only Sentry token", () => {
  const result = load({
    EXPO_PUBLIC_PRIVACY_POLICY_URL: "https://example.invalid/privacy",
    EXPO_PUBLIC_TERMS_URL: "https://example.invalid/terms",
    SENTRY_AUTH_TOKEN: "",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).sentryAuthToken, undefined);
});
