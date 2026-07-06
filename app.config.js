const base = require("./app.json");

const env = process.env.EAS_BUILD_PROFILE ?? process.env.NODE_ENV ?? "development";
const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
const apiBaseUrl =
  envApiBaseUrl ??
  base.expo.extra?.apiBaseUrl;

const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID ??
  base.expo.extra?.googleMobileIosClientId;
const googleMobileIosRedirectUri =
  process.env.EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI ??
  base.expo.extra?.googleMobileIosRedirectUri ??
  "com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect";

const plugins = env === "production"
  ? base.expo.plugins?.filter((plugin) => {
      const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
      return pluginName !== "expo-dev-client";
    })
  : base.expo.plugins;

if (env === "production" && !envApiBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for production build");
}

module.exports = {
  ...base.expo,
  plugins,
  extra: {
    ...base.expo.extra,
    apiBaseUrl,
    googleMobileIosClientId: googleIosClientId,
    googleMobileIosRedirectUri,
  },
};
