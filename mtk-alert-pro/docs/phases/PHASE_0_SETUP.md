# Phase 0: Environment Setup (Day 0)

## Prerequisites

### Required Software

```bash
# 1. Node.js 20 LTS (required for Expo SDK 52)
# Download from https://nodejs.org/

# 2. pnpm (faster, more efficient than npm)
npm install -g pnpm

# 3. Git
# Download from https://git-scm.com/

# 4. Android Studio (for Android development)
# Download from https://developer.android.com/studio
# Install SDK 34 + Build Tools + Emulator

# 5. Java 17 (required for Android builds)
# Included with Android Studio

# 6. EAS CLI (Expo build service)
npm install -g eas-cli
```

### Required Accounts

| Service | Purpose | URL |
|---------|---------|-----|
| Supabase | Backend (Auth, DB, Storage) | https://supabase.com |
| Firebase | Push Notifications | https://console.firebase.google.com |
| Google Play | App Distribution | https://play.google.com/console ($25) |
| RevenueCat | Subscriptions | https://www.revenuecat.com |
| Expo | Build Service | https://expo.dev |

---

## Step 1: Initialize Project

```bash
# Create project with Expo
npx create-expo-app@latest mtk-alert-pro -t expo-template-blank-typescript

cd mtk-alert-pro

# Initialize pnpm workspace
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Restructure for monorepo
mkdir -p apps packages/shared supabase docs
mv src app.json package.json tsconfig.json apps/mobile/

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "mtk-alert-pro",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @mtk/mobile start",
    "android": "pnpm --filter @mtk/mobile android",
    "ios": "pnpm --filter @mtk/mobile ios",
    "build:android:dev": "pnpm --filter @mtk/mobile build:android:dev",
    "build:android:prod": "pnpm --filter @mtk/mobile build:android:prod",
    "test": "pnpm -r test",
    "lint": "biome check .",
    "format": "biome format . --write",
    "supabase:start": "supabase start",
    "supabase:generate": "supabase gen types typescript --local > packages/shared/src/database.types.ts"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "supabase": "^1.200.0",
    "typescript": "~5.6.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "pnpm@9.14.0"
}
EOF
```

---

## Step 2: Configure Mobile App

```bash
cd apps/mobile

# Update package.json
cat > package.json << 'EOF'
{
  "name": "@mtk/mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "prebuild": "expo prebuild",
    "build:android:dev": "eas build --platform android --profile development",
    "build:android:prod": "eas build --platform android --profile production",
    "test": "jest",
    "test:e2e": "maestro test e2e/"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-safe-area-context": "4.14.0",
    "react-native-screens": "~4.3.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    
    "@supabase/supabase-js": "^2.45.0",
    "@react-native-async-storage/async-storage": "2.1.0",
    
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.60.0",
    
    "nativewind": "^4.1.0",
    "react-native-svg": "15.8.0",
    
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    
    "expo-secure-store": "~14.0.0",
    "expo-notifications": "~0.29.0",
    "expo-device": "~7.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@types/react": "~18.3.0",
    "typescript": "~5.6.0",
    "tailwindcss": "^3.4.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.8.0",
    "jest-expo": "~52.0.0"
  }
}
EOF
```

---

## Step 3: Configure Expo

```bash
# apps/mobile/app.json
cat > app.json << 'EOF'
{
  "expo": {
    "name": "MTK AlertPro",
    "slug": "mtk-alert-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "mtkalertpro",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E293B"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.mtk.alertpro"
    },
    "android": {
      "package": "com.mtk.alertpro",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E293B"
      },
      "permissions": [
        "INTERNET",
        "CAMERA",
        "POST_NOTIFICATIONS",
        "FOREGROUND_SERVICE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#EF4444"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
EOF
```

---

## Step 4: Configure TypeScript

```bash
# apps/mobile/tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@mtk/shared": ["../../packages/shared/src"]
    },
    "types": ["nativewind/types"]
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
EOF
```

---

## Step 5: Configure Tailwind/NativeWind

```bash
# apps/mobile/tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#EF4444",
          blue: "#2563EB",
          green: "#10B981",
          navy: "#1E293B",
          orange: "#F59E0B",
          cyan: "#06B6D4",
          purple: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
      },
    },
  },
  plugins: [],
};
EOF

# apps/mobile/global.css
cat > src/global.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
```

---

## Step 6: Configure EAS Build

```bash
# apps/mobile/eas.json
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "production"
      }
    }
  }
}
EOF
```

---

## Step 7: Environment Variables

```bash
# apps/mobile/.env.example
cat > .env.example << 'EOF'
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Firebase (for FCM)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY=your-api-key

# App Config
EXPO_PUBLIC_APP_ENV=development
EOF

# Copy to .env
cp .env.example .env
# Add .env to .gitignore
echo ".env" >> ../../.gitignore
```

---

## Step 8: Setup Supabase

```bash
cd ../..  # Back to root

# Initialize Supabase
supabase init

# Create initial migration
mkdir -p supabase/migrations
cat > supabase/migrations/20241201000000_initial_schema.sql << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  subscription_expires_at TIMESTAMPTZ,
  fcm_token TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cameras table
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rtsp_url TEXT NOT NULL,
  username TEXT,
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  detection_settings JSONB DEFAULT '{"person": true, "vehicle": true, "sensitivity": 0.7}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('person', 'vehicle', 'face', 'motion')),
  confidence FLOAT NOT NULL,
  snapshot_url TEXT,
  video_clip_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own cameras" ON public.cameras FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alerts" ON public.alerts FOR ALL USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX idx_cameras_user_id ON public.cameras(user_id);
CREATE INDEX idx_alerts_camera_id ON public.alerts(camera_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
EOF
```

---

## Step 9: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Setup Expo prebuild (generates native projects)
cd apps/mobile
npx expo prebuild
```

---

## Step 10: Verification Checklist

- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Android Studio with SDK 34
- [ ] EAS CLI authenticated (`eas whoami`)
- [ ] Supabase project created
- [ ] Firebase project created
- [ ] Environment variables configured
- [ ] Project compiles (`pnpm dev`)

---

## Next Phase

➡️ [Phase 1: Foundation](./PHASE_1_FOUNDATION.md)
