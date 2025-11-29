/**
 * Expo app configuration for Shakir Super League
 */

module.exports = {
  name: "Shakir Super League",
  slug: "shakir-super-league",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#16a34a",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mtkcodex.ssl",
    infoPlist: {
      NSUserNotificationsUsageDescription: "We need to send you notifications about match updates, wickets, and match starts.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#16a34a",
    },
    package: "com.mtkcodex.ssl",
    permissions: [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "ssl.cricket",
            pathPrefix: "/match",
          },
          {
            scheme: "ssl",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  scheme: "ssl",
  plugins: [
    "expo-router",
    "expo-localization",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#16a34a",
        sounds: ["./assets/notification-sound.wav"],
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000",
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  },
  updates: {
    url: "https://u.expo.dev/your-project-id",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
};

