const base = require("./app.json");

const env = process.env.EAS_BUILD_PROFILE ?? process.env.NODE_ENV ?? "development";
const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
const apiBaseUrl =
  envApiBaseUrl ??
  base.expo.extra?.apiBaseUrl;

if (env === "production" && !envApiBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for production build");
}

module.exports = {
  ...base.expo,
  extra: {
    ...base.expo.extra,
    apiBaseUrl,
  },
};
