const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

const forbiddenIosKeys = [
  "NSFaceIDUsageDescription",
  "NSLocationAlwaysAndWhenInUseUsageDescription",
  "NSLocationAlwaysUsageDescription",
  "NSMicrophoneUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "UIBackgroundModes",
];

const allowedAndroidPermissions = new Set([
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.CAMERA",
  "android.permission.INTERNET",
  "android.permission.VIBRATE",
]);

const withPrivacyMinimum = (config) => {
  config = withInfoPlist(config, (nextConfig) => {
    for (const key of forbiddenIosKeys) {
      delete nextConfig.modResults[key];
    }
    return nextConfig;
  });

  return withAndroidManifest(config, (nextConfig) => {
    const manifest = nextConfig.modResults.manifest;
    manifest["uses-permission"] = (manifest["uses-permission"] ?? []).filter(
      (permission) => allowedAndroidPermissions.has(permission.$["android:name"]),
    );
    return nextConfig;
  });
};

module.exports = withPrivacyMinimum;
