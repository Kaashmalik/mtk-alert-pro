# 🚀 MTK AlertPro - Complete Implementation Plan

## Overview

A production-ready React Native AI CCTV security app following 2025 best practices.

---

## 📋 Phase Breakdown (12 Weeks)

| Phase | Duration | Focus | Deliverable |
|-------|----------|-------|-------------|
| **0** | Week 0 | Environment Setup | Dev environment ready |
| **1** | Week 1-2 | Foundation | Auth + Navigation + Core UI |
| **2** | Week 3-4 | Camera Integration | RTSP streaming + camera management |
| **3** | Week 5-7 | AI/ML Layer | ML Kit + detection + alerts |
| **4** | Week 8-9 | Core Features | Recording + history + settings |
| **5** | Week 10-11 | Polish & Testing | Optimization + testing |
| **6** | Week 12 | Launch | Store deployment |

---

## 🛠️ Tech Stack (2025 Best Practices)

### Frontend
- **React Native**: 0.76+ (New Architecture enabled)
- **Expo**: SDK 52 (Prebuild workflow for native modules)
- **TypeScript**: 5.6+
- **State**: Zustand 5.0 + TanStack Query v5
- **Navigation**: React Navigation 7
- **Styling**: NativeWind 4.0 (Tailwind CSS v4)
- **Forms**: React Hook Form + Zod

### Backend
- **Supabase**: Auth, Database, Storage, Edge Functions
- **Firebase**: FCM for push notifications

### AI/ML
- **Google ML Kit**: Object detection, face detection
- **Vision Camera**: Frame processing for AI

### Quality
- **Testing**: Jest + React Native Testing Library + Maestro E2E
- **Linting**: Biome (ESLint + Prettier replacement)
- **CI/CD**: GitHub Actions + EAS Build

---

## 📁 Project Structure

```
mtk-alert-pro/
├── apps/
│   └── mobile/                    # React Native app
│       ├── src/
│       │   ├── app/               # Expo Router screens
│       │   ├── components/        # Reusable UI components
│       │   │   ├── ui/            # Base components (Button, Input, etc.)
│       │   │   ├── camera/        # Camera-specific components
│       │   │   ├── alerts/        # Alert-related components
│       │   │   └── layouts/       # Layout components
│       │   ├── features/          # Feature modules
│       │   │   ├── auth/          # Authentication feature
│       │   │   ├── cameras/       # Camera management
│       │   │   ├── detection/     # AI detection logic
│       │   │   ├── alerts/        # Alert management
│       │   │   └── settings/      # App settings
│       │   ├── lib/               # Utilities & configs
│       │   │   ├── supabase/      # Supabase client
│       │   │   ├── firebase/      # Firebase config
│       │   │   ├── mlkit/         # ML Kit integration
│       │   │   └── utils/         # Helper functions
│       │   ├── stores/            # Zustand stores
│       │   ├── hooks/             # Custom React hooks
│       │   └── types/             # TypeScript types
│       ├── assets/                # Images, fonts, icons
│       ├── android/               # Android native code
│       ├── app.json               # Expo config
│       ├── eas.json               # EAS Build config
│       └── package.json
├── packages/
│   └── shared/                    # Shared code (types, utils)
├── supabase/
│   ├── migrations/                # Database migrations
│   ├── functions/                 # Edge Functions
│   └── seed.sql                   # Seed data
├── .github/
│   └── workflows/                 # CI/CD workflows
├── docs/                          # Documentation
└── package.json                   # Root package.json (pnpm workspace)
```

---

## 🔐 Database Schema (Supabase)

```sql
-- Users profile extension
CREATE TABLE profiles (
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

-- Cameras
CREATE TABLE cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('person', 'vehicle', 'face', 'motion')),
  confidence FLOAT NOT NULL,
  snapshot_url TEXT,
  video_clip_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detection zones (Pro feature)
CREATE TABLE detection_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polygon JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_zones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own cameras" ON cameras FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alerts" ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own zones" ON detection_zones FOR ALL 
  USING (camera_id IN (SELECT id FROM cameras WHERE user_id = auth.uid()));
```

---

## 📊 Implementation Phases

See individual phase files for detailed implementation:

- [Phase 0: Environment Setup](./docs/phases/PHASE_0_SETUP.md)
- [Phase 1: Foundation](./docs/phases/PHASE_1_FOUNDATION.md)
- [Phase 2: Camera Integration](./docs/phases/PHASE_2_CAMERAS.md)
- [Phase 3: AI/ML Layer](./docs/phases/PHASE_3_AI_ML.md)
- [Phase 4: Core Features](./docs/phases/PHASE_4_FEATURES.md)
- [Phase 5: Polish & Testing](./docs/phases/PHASE_5_POLISH.md)
- [Phase 6: Launch](./docs/phases/PHASE_6_LAUNCH.md)

---

## ⚡ Quick Start Commands

```bash
# Clone and install
git clone https://github.com/Kaashmalik/mtk-alert-pro.git
cd mtk-alert-pro
pnpm install

# Environment setup
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env with your credentials

# Development
pnpm dev                    # Start Expo development
pnpm android                # Run on Android
pnpm ios                    # Run on iOS

# Testing
pnpm test                   # Run unit tests
pnpm test:e2e               # Run E2E tests

# Building
pnpm build:android:dev      # Development APK
pnpm build:android:prod     # Production AAB
```

---

## 📚 Key Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react-native": "0.76.x",
    "typescript": "~5.6.0",
    
    "@supabase/supabase-js": "^2.45.0",
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/messaging": "^21.0.0",
    
    "@react-navigation/native": "^7.0.0",
    "expo-router": "~4.0.0",
    
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.60.0",
    
    "nativewind": "^4.0.0",
    "tailwindcss": "^4.0.0",
    
    "react-native-vision-camera": "^4.6.0",
    "react-native-video": "^6.7.0",
    
    "@react-native-ml-kit/face-detection": "^2.0.0",
    "@react-native-ml-kit/object-detection": "^2.0.0",
    
    "react-native-revenuecat": "^8.2.0",
    "expo-notifications": "~0.29.0"
  }
}
```

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| APK Size | < 50MB |
| Cold Start | < 3 seconds |
| Detection Latency | < 500ms |
| Crash-Free Rate | > 99.5% |
| App Rating | > 4.5 stars |
| Free → Pro Conversion | 15-20% |

---

**Next Step**: Start with [Phase 0: Environment Setup](./docs/phases/PHASE_0_SETUP.md)
