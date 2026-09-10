import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const iosInfo = read("ios/Fragments/Info.plist");
const iosProject = read("ios/Fragments.xcodeproj/project.pbxproj");
const androidManifest = read("android/app/src/main/AndroidManifest.xml");
const androidBuild = read("android/app/build.gradle");

assert(iosInfo.includes("<string>Fragments</string>"), "iOS display name must be Fragments");
assert(iosProject.includes('PRODUCT_BUNDLE_IDENTIFIER = "com.nico8156.fragments"'), "iOS bundle identifier is stale");
assert(iosInfo.includes("<string>fragments</string>"), "iOS fragments deep-link scheme is missing");
assert(
  iosInfo.includes("com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe"),
  "iOS Google OAuth scheme is missing",
);
assert(
  iosInfo.includes("Fragments utilise l’appareil photo pour lire le texte de vos tickets."),
  "iOS camera purpose text is missing or inaccurate",
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
  "NSPhotoLibraryUsageDescription",
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

console.log("Native release configuration is aligned.");
