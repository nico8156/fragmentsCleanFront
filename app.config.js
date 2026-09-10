const environment = process.env.EAS_BUILD_PROFILE ?? process.env.NODE_ENV ?? "development";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  (environment === "production" ? undefined : "https://fragments-staging.anchor-event.fr");
const googleMobileIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_MOBILE_IOS_CLIENT_ID ??
  (environment === "production"
    ? undefined
    : "255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe.apps.googleusercontent.com");
const googleMobileIosRedirectUri =
  process.env.EXPO_PUBLIC_GOOGLE_MOBILE_IOS_REDIRECT_URI ??
  (environment === "production"
    ? undefined
    : "com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe:/oauthredirect");

if (environment === "production" && !apiBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for production build");
}

if (environment === "production" && (!googleMobileIosClientId || !googleMobileIosRedirectUri)) {
  throw new Error("Missing Google OAuth production configuration");
}

const plugins = [
  "./plugins/withPrivacyMinimum",
  ["expo-router", { root: "app/routes" }],
  [
    "expo-splash-screen",
    {
      image: "./assets/images/splash-icon.png",
      imageWidth: 200,
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
  ],
  "expo-secure-store",
  [
    "expo-location",
    {
      locationWhenInUsePermission:
        "Fragments utilise votre position uniquement lorsque vous explorez les cafés autour de vous.",
      isIosBackgroundLocationEnabled: false,
    },
  ],
  [
    "expo-image-picker",
    {
      cameraPermission:
        "Fragments utilise l’appareil photo pour lire le texte de vos tickets.",
    },
  ],
  "expo-web-browser",
];

if (environment !== "production") {
  plugins.push(["expo-dev-client", { launchMode: "most-recent" }]);
}

module.exports = {
  expo: {
    name: "Fragments",
    slug: "fragmentsCleanFront",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: [
      "fragments",
      "com.googleusercontent.apps.255942605258-jisbuvlprrs8pp2qb6ft3psa6hg650fe",
    ],
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.nico8156.fragments",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      permissions: ["android.permission.ACCESS_FINE_LOCATION", "android.permission.CAMERA"],
      package: "com.nico8156.fragments",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins,
    experiments: { typedRoutes: true },
    extra: {
      apiBaseUrl,
      router: {},
      eas: { projectId: "138089c2-0d66-415d-baa4-46495ea3a90b" },
      googleMobileIosClientId,
      googleMobileIosRedirectUri,
    },
  },
};
