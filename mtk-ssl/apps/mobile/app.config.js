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

/**
 * Fetch tenant branding from API
 */
async function getTenantBranding(tenantId) {
  if (!tenantId) return null;

  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/tenants/${tenantId}/branding`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch tenant branding:", error);
  }
  return null;
}

/**
 * Generate app config based on tenant branding
 */
async function generateConfig() {
  let config = { ...defaultConfig };

  // If tenant ID is provided, fetch branding
  if (tenantId && isEnterprise) {
    const branding = await getTenantBranding(tenantId);
    if (branding) {
      config = {
        ...config,
        name: branding.appName || config.name,
        slug: branding.appName?.toLowerCase().replace(/\s+/g, "-") || config.slug,
        splash: {
          ...config.splash,
          image: branding.mobileAppSplashUrl || config.splash.image,
          backgroundColor: branding.primaryColor || config.splash.backgroundColor,
        },
        icon: branding.mobileAppIconUrl || config.icon,
        ios: {
          ...config.ios,
          bundleIdentifier: branding.mobileAppBundleId || config.ios.bundleIdentifier,
        },
        android: {
          ...config.android,
          package: branding.mobileAppPackageName || config.android.package,
          adaptiveIcon: {
            ...config.android.adaptiveIcon,
            backgroundColor: branding.primaryColor || config.android.adaptiveIcon.backgroundColor,
          },
        },
      };
    }
  }

  return config;
}

// Export config (Expo will use this)
module.exports = generateConfig();

