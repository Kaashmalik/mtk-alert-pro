# 📱 Mobile Build Troubleshooting Log & Roadmap

**Date:** Dec 2, 2025  
**Goal:** Build Android APK (Preview) for MTK AlertPro  
**Status:** ✅ BUILD SUCCESSFUL!

## 🎉 Success!

**APK Build:** https://expo.dev/accounts/mtk-alert-pro/projects/mtk-alert-pro/builds/efe85154-6f17-4ce8-9926-83be08d6dc05

The Android APK was successfully built on Dec 2, 2025. Scan the QR code on the build page or download directly.

---

## 🚨 The Initial Problem
**Symptom:** `eas build` was trying to upload a **1.1 GB archive**, causing a `400 Bad Request` error from Expo servers.
**Cause:** The project is a **pnpm monorepo**. Even when running from `apps/mobile`, EAS CLI (and tar) follows symlinks in `node_modules`, pulling in the root `node_modules` (checking in at ~800MB+) plus all git history.

---

## 🛠️ Attempt History (What We Tried)

### 1. `.easignore` in `apps/mobile` (❌ Failed)
- **Action:** Added `node_modules/` and `../node_modules/` to `.easignore`.
- **Result:** Archive still 1.1 GB.
- **Why:** EAS CLI in a monorepo context seems to ignore exclusions that break the workspace structure or follows git-tracked files differently.

### 2. `pnpm deploy` to `pruned/` (❌ Failed)
- **Action:** Ran `pnpm --filter @mtk/mobile deploy pruned --prod`.
- **Result:** Created a standalone folder, but it still contained a ~400MB `node_modules` folder. EAS uploaded the whole thing.
- **Size:** Still ~1.1 GB compressed.

### 3. `pruned/` without `node_modules` (❌ Failed)
- **Action:** Deleted `node_modules` in `pruned` and used `.easignore`.
- **Verification:** `Get-ChildItem` showed only 2.5 MB of files.
- **Result:** EAS **STILL** created a 1.1 GB archive.
- **Why:** EAS CLI detects the `.git` folder in the root (parent) and treats the build as part of the git repo, seemingly pulling in the full context regardless of where `eas build` is run.

### 4. **Physical Isolation (✅ SUCCESS for Size)**
- **Action:** Moved the `pruned` folder OUTSIDE the repo to `C:\Temp\mtk-build`.
- **Setup:**
  - `cd C:\Temp\mtk-build`
  - `npm install` (Fresh install)
  - `.easignore` excluding `node_modules`
- **Result:** **Archive size dropped to 4.5 MB.** Upload took 3 seconds.

---

## 🐛 Dependency Hell (The Next Battle)

Once the upload worked, the build failed on the server.

### Issue 1: React 19 Incompatibility
- **Error:** Peer dependency conflicts with `lucide-react-native` and `expo-router`.
- **Fix:** Downgraded to the "Golden Stack" for Expo SDK 52:
  - `react`: `18.3.1`
  - `react-native`: `0.76.5`
  - `expo`: `~52.0.0`

### Issue 2: Missing Dependencies
- **Error:** `Unable to resolve module ...` during bundling.
- **Cause:** The `pnpm deploy` process didn't include devDependencies or some implicitly used packages in the standalone `package.json`.
- **Fix:** Manually added missing deps to `package.json`:
  - `react-native-svg`
  - `react-hook-form`
  - `react-native-screens`
  - `react-native-safe-area-context`
  - `react-native-worklets-core`

### Issue 3: Metro Config
- **Error:** Bundler crash.
- **Cause:** Copied `metro.config.js` still had monorepo paths (`path.resolve(projectRoot, '../..')`).
- **Fix:** Replaced with standard standalone config.

---

## ✅ Final Solution (What Fixed It)

**All Phases Passed:**
1. ✅ **Compression:** 5.0 MB (with prebuilt android folder)
2. ✅ **Upload:** Success
3. ✅ **Install Dependencies:** Success
4. ✅ **Bundle JavaScript:** Success
5. ✅ **Run gradlew:** Success

**Key Fixes Applied:**

### 1. Physical Isolation
Moved the build to `C:\Temp\mtk-build` outside the pnpm monorepo to avoid symlink issues.

### 2. Disabled New Architecture
```json
// app.json
"newArchEnabled": false,
"edgeToEdgeEnabled": false
```

### 3. Fixed Kotlin Version
Added to `android/gradle.properties`:
```
android.kotlinVersion=1.9.24
```

### 4. Removed Problematic Dependencies
Removed `nativewind`, `react-native-worklets-core`, and `react-native-css-interop` which were causing native build conflicts.

### 5. Minimal Babel Config
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

### 6. Standard Metro Config
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
```

---

**Working `package.json` (Save this):**
```json
{
  "name": "@mtk/mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "expo-router": "~4.0.0",
    "nativewind": "^4.1.23",
    "lucide-react-native": "^0.460.0",
    "tailwindcss": "^3.4.1",
    "react-native-reanimated": "~3.16.1",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "15.9.0",
    "@supabase/supabase-js": "^2.45.0",
    "zustand": "^5.0.0",
    "react-dom": "18.3.1",
    "react-native-web": "~0.19.13",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "date-fns": "^4.1.0",
    "@react-native-async-storage/async-storage": "1.23.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "typescript": "^5.3.3"
  },
  "private": true,
  "packageManager": "npm@10.8.2"
}
```
