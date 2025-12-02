# MTK AlertPro - Assets Guide

## 📱 Required App Icons & Images

### Image 1: Splash Screen (Dark Background with Logo)
**File:** `splash-icon.png`  
**Dimensions:** 1242 x 2436 px (or similar ratio)  
**Format:** PNG with transparency  
**Usage:** Displayed when app launches  
**Location:** `apps/mobile/assets/splash-icon.png`

---

### Images 2, 3, 4: App Icon (Camera Lens with Red Dot)
These are the same icon, use for multiple purposes:

#### Main App Icon
**File:** `icon.png`  
**Dimensions:** 1024 x 1024 px  
**Format:** PNG  
**Usage:** iOS app icon, default Android icon  
**Location:** `apps/mobile/assets/icon.png`

#### Android Adaptive Icon
**File:** `adaptive-icon.png`  
**Dimensions:** 1024 x 1024 px  
**Format:** PNG with transparency  
**Usage:** Android adaptive icon (foreground layer)  
**Location:** `apps/mobile/assets/adaptive-icon.png`  
**Note:** Background color set to `#1E293B` in app.json

#### Web Favicon
**File:** `favicon.png`  
**Dimensions:** 48 x 48 px (or 512 x 512 px)  
**Format:** PNG  
**Usage:** Browser tab icon  
**Location:** `apps/mobile/assets/favicon.png`

#### Notification Icon
**File:** `notification-icon.png`  
**Dimensions:** 96 x 96 px  
**Format:** PNG (white icon on transparent background for Android)  
**Usage:** Push notification icon  
**Location:** `apps/mobile/assets/notification-icon.png`

---

## 🎨 Quick Setup Instructions

### Step 1: Save Your Images
Save the 4 uploaded images to `apps/mobile/assets/` with these exact names:

1. **Image 1** (splash screen) → `splash-icon.png`
2. **Image 2** (app icon) → `icon.png`
3. **Image 3** (app icon) → `adaptive-icon.png`
4. **Image 4** (app icon) → `favicon.png`

### Step 2: Create Notification Icon
The notification icon should be:
- White silhouette on transparent background
- Simple, recognizable shape
- 96 x 96 px minimum

For now, copy `icon.png` to `notification-icon.png` (we can optimize later)

### Step 3: Verify Configuration
All paths are already configured in `app.json`:
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash-icon.png",
    "backgroundColor": "#1E293B"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#1E293B"
    }
  },
  "web": {
    "favicon": "./assets/favicon.png"
  }
}
```

---

## ✅ Final Checklist

After saving images, verify:
- [ ] `assets/icon.png` exists (1024x1024)
- [ ] `assets/splash-icon.png` exists (splash screen)
- [ ] `assets/adaptive-icon.png` exists (1024x1024)
- [ ] `assets/favicon.png` exists (48x48 or larger)
- [ ] `assets/notification-icon.png` exists (96x96 or larger)

---

## 🚀 Next Steps

### Test the Assets
```bash
# Start the app to see splash screen
pnpm dev

# Build APK to see app icon
eas build --platform android --profile preview
```

### Generate Additional Sizes (Optional)
Use this tool to generate all required sizes:
- **iOS:** Multiple sizes for App Store (20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt in @1x, @2x, @3x)
- **Android:** ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi

Expo handles most of this automatically during build!

---

## 📐 Recommended Dimensions

| Asset | Recommended Size | Format |
|-------|-----------------|--------|
| App Icon | 1024 x 1024 px | PNG |
| Adaptive Icon | 1024 x 1024 px | PNG |
| Splash Screen | 1242 x 2436 px | PNG |
| Favicon | 48 x 48 px | PNG/ICO |
| Notification Icon | 96 x 96 px | PNG |

---

**Note:** Expo's build service will automatically resize and optimize your icons for all required dimensions during the build process.
