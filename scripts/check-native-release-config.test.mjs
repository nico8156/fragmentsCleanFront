import { test } from "node:test";
import assert from "node:assert/strict";
import { readNativeReleaseConfig, validateNativeReleaseConfig } from "./check-native-release-config.mjs";

test("the committed native configuration passes the release guard", () => {
  assert.doesNotThrow(() => validateNativeReleaseConfig(readNativeReleaseConfig()));
});

test("rejects missing photo permission before a device can crash", () => {
  const config = readNativeReleaseConfig();
  config.iosInfo = config.iosInfo.replace(/<key>NSPhotoLibraryUsageDescription<\/key>\s*<string>[^<]*<\/string>/, "");
  assert.throws(() => validateNativeReleaseConfig(config), /photo library/);
});

test("rejects the previously empty Apple entitlement", () => {
  const config = readNativeReleaseConfig();
  config.iosEntitlements = "<plist><dict/></plist>";
  assert.throws(() => validateNativeReleaseConfig(config), /Apple entitlement/);
});

test("rejects a native build without symbol and source-map uploads", () => {
  const config = readNativeReleaseConfig();
  config.iosProject = config.iosProject.replaceAll("sentry-xcode-debug-files.sh", "missing-debug-files-script");
  assert.throws(() => validateNativeReleaseConfig(config), /debug-symbol/);

  const metroConfig = readNativeReleaseConfig();
  metroConfig.metroConfig = "module.exports = {};";
  assert.throws(() => validateNativeReleaseConfig(metroConfig), /source maps/);
});

test("keeps unrelated microphone and background location permissions forbidden", () => {
  for (const key of ["NSMicrophoneUsageDescription", "NSLocationAlwaysUsageDescription", "UIBackgroundModes"]) {
    const config = readNativeReleaseConfig();
    config.iosInfo = config.iosInfo.replace("</dict>", `<key>${key}</key><string>unused</string></dict>`);
    assert.throws(() => validateNativeReleaseConfig(config), /forbidden privacy capability/);
  }
});
