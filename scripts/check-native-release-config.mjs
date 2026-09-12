import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

export const readNativeReleaseConfig = () => ({
  iosInfo: read("ios/Fragments/Info.plist"),
  iosProject: read("ios/Fragments.xcodeproj/project.pbxproj"),
  iosEntitlements: read("ios/Fragments/Fragments.entitlements"),
  androidManifest: read("android/app/src/main/AndroidManifest.xml"),
  androidBuild: read("android/app/build.gradle"),
});

export function validateNativeReleaseConfig({ iosInfo, iosProject, iosEntitlements, androidManifest, androidBuild }) {

assert(iosInfo.includes("<string>Fragments</string>"), "iOS display name must be Fragments");
assert(iosProject.includes('PRODUCT_BUNDLE_IDENTIFIER = "com.nico8156.fragments"'), "iOS bundle identifier is stale");
assert(iosInfo.includes("<string>fragments</string>"), "iOS fragments deep-link scheme is missing");
assert(
  iosInfo.includes("com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe"),
  "iOS Google OAuth scheme is missing",
);
assert(
  iosInfo.includes("Fragments utilise l’appareil photo pour lire tes tickets et ajouter tes photos."),
  "iOS camera purpose text is missing or inaccurate",
);
assert(
  /<key>NSPhotoLibraryUsageDescription<\/key>\s*<string>[^<]+<\/string>/.test(iosInfo),
  "iOS photo library purpose text is required by the media picker",
);
assert(
  /<key>com.apple.developer.applesignin<\/key>\s*<array>\s*<string>Default<\/string>\s*<\/array>/.test(iosEntitlements),
  "iOS Sign in with Apple entitlement is missing",
);
assert(
  iosInfo.includes("Fragments utilise votre position uniquement lorsque vous explorez les cafés autour de vous."),
  "iOS foreground location purpose text is missing or inaccurate",
);

for (const forbiddenKey of [
  "NSFaceIDUsageDescription",
  "NSLocationAlwaysAndWhenInUseUsageDescription",
  "NSLocationAlwaysUsageDescription",
  "NSMicrophoneUsageDescription",
  "UIBackgroundModes",
]) {
  assert(!iosInfo.includes(forbiddenKey), `iOS contains forbidden privacy capability: ${forbiddenKey}`);
}

assert(androidBuild.includes("namespace 'com.nico8156.fragments'"), "Android namespace is stale");
assert(androidBuild.includes("applicationId 'com.nico8156.fragments'"), "Android application id is stale");
assert(androidManifest.includes('<data android:scheme="fragments"/>'), "Android fragments deep-link scheme is missing");

const allowedAndroidPermissions = new Set([
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.CAMERA",
  "android.permission.INTERNET",
  "android.permission.VIBRATE",
]);
const permissions = [...androidManifest.matchAll(/<uses-permission android:name="([^"]+)"\/>/g)].map((match) => match[1]);
for (const permission of permissions) {
  assert(allowedAndroidPermissions.has(permission), `Android contains forbidden permission: ${permission}`);
}

}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateNativeReleaseConfig(readNativeReleaseConfig());
  console.log("Native source configuration is aligned; signed build and device validation remain required.");
}
