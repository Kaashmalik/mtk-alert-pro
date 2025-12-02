# 🚀 MTK AlertPro - Build APK Guide

## Quick Start: Build Your First APK in 5 Minutes

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
# Use your Expo account or create one at https://expo.dev/signup
```

### Step 3: Configure EAS (First Time Only)
```bash
cd d:\MalikTech\mtk-alert-pro\apps\mobile
eas build:configure
```

Select:
- Platform: `Android`
- Generate new keystore: `Yes`

### Step 4: Build Preview APK
```bash
eas build --platform android --profile preview
```

This will:
1. Upload your code to EAS servers
2. Build an APK (not AAB)
3. Provide download link when complete (~10-15 mins)

### Step 5: Download & Install
1. Wait for build to complete
2. Download APK from provided link
3. Transfer to Android device
4. Install APK (enable "Install from Unknown Sources")
5. **Test the app!**

---

## Build Profiles Explained

### `preview` (for testing)
- **Output**: APK file
- **Use**: Testing on real devices
- **Install**: Direct install on Android
- **Build time**: 10-15 minutes

```bash
eas build --platform android --profile preview
```

### `production` (for Google Play)
- **Output**: AAB (Android App Bundle)
- **Use**: Google Play Store submission
- **Install**: Cannot install directly
- **Build time**: 10-15 minutes

```bash
eas build --platform android --profile production
```

### `development` (for debugging)
- **Output**: Development client
- **Use**: Testing with Expo Dev Client (like Expo Go but custom)
- **Install**: Direct install
- **Build time**: 10-15 minutes

```bash
eas build --platform android --profile development
```

---

## What Gets Included in the Build?

### ✅ Included
- All your source code (`src/` folder)
- Dependencies (`node_modules`)
- Assets (images, fonts)
- Environment variables from `.env`
- Native modules (Expo SDK packages)

### ❌ NOT Included
- `.env` file itself (values are bundled)
- `node_modules/` (rebuilt on EAS servers)
- Development tools
- Test files

---

## Important: Credentials & App Signing

### First Build
EAS will ask to generate a keystore:
```
? Would you like to generate a Keystore automatically?
> Yes
```

**IMPORTANT:** EAS manages this keystore for you. Never lose access to your Expo account!

### Viewing Your Credentials
```bash
eas credentials
```

### Download Keystore (backup)
```bash
eas credentials -p android
# Select: Download credentials
```

Store this safely! You'll need it if you:
- Switch to local builds
- Migrate to a different build service
- Lose access to your Expo account

---

## Testing Your APK

### Before You Test
1. **Verify Supabase credentials** in `.env`
2. **Test in Expo Go** first to catch bugs
3. **Run typecheck**: `pnpm run typecheck`

### On Device Testing
1. Install APK
2. Open app
3. Test checklist:
   - [ ] App opens without crashes
   - [ ] Login works
   - [ ] Registration works
   - [ ] Camera tab loads
   - [ ] Alerts tab loads
   - [ ] Settings tab loads
   - [ ] Logout works
   - [ ] **Reopen app** - should stay logged in (SecureStore persistence)

### Common Issues

#### "App keeps crashing on startup"
- Check if Supabase URL/key is correct
- View logs: `adb logcat | grep ReactNative`

#### "Login doesn't persist after closing app"
- This is normal in Expo Go
- Only works in built APK (uses SecureStore)

#### "Cannot connect to Supabase"
- Check internet connection
- Verify `.env` values are correct
- Check Supabase project is active

---

## Build Monitoring

### Check Build Status
```bash
eas build:list
```

### View Build Logs (if failed)
```bash
eas build:view
```

Or visit: https://expo.dev/accounts/[your-account]/projects/mtk-mobile/builds

---

## Next Steps After First APK

### 1. Internal Testing
- Share APK with team/beta testers
- Gather feedback
- Fix bugs

### 2. Prepare for Production
- Test all features thoroughly
- Add app icon (`app.json` → `icon`)
- Add splash screen (`app.json` → `splash`)
- Update app version in `package.json`

### 3. Google Play Store Submission
- Build production AAB: `eas build -p android --profile production`
- Create Google Play Console account
- Fill in store listing
- Upload AAB
- Submit for review

---

## Pro Tips

### Faster Builds
```bash
# Build with cache (reuses previous build artifacts)
eas build --platform android --profile preview --no-wait
```

### Build for Both Platforms
```bash
# Build Android and iOS together
eas build --platform all
```

### Auto-Submit to Stores (EAS Submit)
```bash
# After production build
eas submit --platform android --latest
```

### CI/CD Integration
Use GitHub Actions to auto-build on git push:
```yaml
# .github/workflows/build.yml
name: EAS Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --non-interactive
```

---

## Build Configuration Reference

### `eas.json` Structure
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Environment Variables in EAS
```bash
# Set build-time secrets
eas secret:create --scope project --name SUPABASE_SERVICE_ROLE_KEY --value "your-secret"
```

---

## Troubleshooting

### Build Fails: "Gradle error"
- Usually dependency conflict
- Check `package.json` versions match Expo SDK
- Run `npx expo install --fix` before building

### Build Fails: "Out of memory"
- EAS has memory limits
- Reduce bundle size (remove unused dependencies)

### "Invalid keystore"
- Delete old build credentials: `eas credentials`
- Generate new keystore

---

## Cost & Limits

### Free Tier (Expo)
- **30 builds/month** (shared between iOS/Android)
- Build queue priority: Normal
- Build time limit: 2 hours

### Paid Tier ($29/month)
- **Unlimited builds**
- Priority queue
- Faster builds
- More concurrent builds

---

## Need Help?

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Expo Discord**: https://chat.expo.dev/
- **Stack Overflow**: Tag `expo` or `eas-build`

---

**Last Updated:** December 1, 2024  
**Author:** Cascade AI Assistant  
**Project:** MTK AlertPro v1.0
