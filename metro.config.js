const { installExpoMetroWatchCompatibility } = require("./scripts/metro-watch-compat.cjs");

installExpoMetroWatchCompatibility();

const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = getSentryExpoConfig(__dirname);
