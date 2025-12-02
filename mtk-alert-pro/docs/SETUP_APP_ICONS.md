# 🎨 MTK AlertPro - App Icon Setup Instructions

## 📸 Your Uploaded Images

You've uploaded 4 beautiful images for MTK AlertPro. Here's how to set them up:

---

## 🗂️ Step-by-Step Setup

### Step 1: Create Assets Directory (if needed)
The directory should already exist, but verify:
```bash
cd d:\MalikTech\mtk-alert-pro\apps\mobile
mkdir -p assets
```

### Step 2: Save Your Images

Save each uploaded image to `d:\MalikTech\mtk-alert-pro\apps\mobile\assets\` with these **exact** names:

#### Image 1: Splash Screen (Dark background with MTK AlertPro logo)
- **Save as:** `splash-icon.png`
- **Full path:** `d:\MalikTech\mtk-alert-pro\apps\mobile\assets\splash-icon.png`
- **Purpose:** Shown when app launches
- **Recommended size:** 1242 x 2436 px (or keep original size)

#### Image 2: App Icon (Camera lens with red dot)
- **Save as:** `icon.png`
- **Full path:** `d:\MalikTech\mtk-alert-pro\apps\mobile\assets\icon.png`
- **Purpose:** Main app icon for iOS and Android
- **Recommended size:** 1024 x 1024 px

#### Image 3: Adaptive Icon (Same camera lens icon)
- **Save as:** `adaptive-icon.png`
- **Full path:** `d:\MalikTech\mtk-alert-pro\apps\mobile\assets\adaptive-icon.png`
- **Purpose:** Android adaptive icon (Material Design)
- **Recommended size:** 1024 x 1024 px

#### Image 4: Favicon (Same camera lens icon, smaller)
- **Save as:** `favicon.png`
- **Full path:** `d:\MalikTech\mtk-alert-pro\apps\mobile\assets\favicon.png`
- **Purpose:** Web browser tab icon
- **Recommended size:** 48 x 48 px or 512 x 512 px

### Step 3: Create Notification Icon
For the notification icon, you can either:

**Option A:** Copy the main icon
```bash
cd d:\MalikTech\mtk-alert-pro\apps\mobile\assets
copy icon.png notification-icon.png
```

**Option B:** Create a white silhouette version (recommended for Android)
- Use image editing software
- Create white icon on transparent background
- Save as `notification-icon.png`
- Size: 96 x 96 px minimum

---

## ✅ Verify Your Setup

After saving all images, run:
```bash
cd d:\MalikTech\mtk-alert-pro\apps\mobile
pnpm run verify-assets
```

You should see:
```
✅ icon.png                   (XX KB) - Main app icon (iOS/Android)
✅ splash-icon.png            (XX KB) - Splash screen
✅ adaptive-icon.png          (XX KB) - Android adaptive icon
✅ favicon.png                (XX KB) - Web favicon
✅ notification-icon.png      (XX KB) - Push notification icon

✅ All required assets are present!
```

---

## 🎨 Current Configuration (Already Set in app.json)

Your `app.json` is already configured to use these assets:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
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
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#EF4444"
        }
      ]
    ]
  }
}
```

✅ **No configuration changes needed!** Just save the images.

---

## 🧪 Test Your Assets

### 1. Test Splash Screen
```bash
pnpm dev
```
- Open the app in Expo Go
- You should see your splash screen when the app loads

### 2. Test App Icon (Build Required)
```bash
cd d:\MalikTech\mtk-alert-pro\apps\mobile
eas build --platform android --profile preview
```
- Wait for build to complete
- Download and install APK
- Check home screen - your app icon should appear!

### 3. Test Favicon (Web)
```bash
pnpm dev
# Press 'w' to open web version
```
- Check browser tab for your favicon

---

## 📐 Image Size Reference

| Asset | Current Config | Recommended Size | Format |
|-------|---------------|------------------|--------|
| App Icon | `icon.png` | 1024 x 1024 px | PNG |
| Adaptive Icon | `adaptive-icon.png` | 1024 x 1024 px | PNG |
| Splash Screen | `splash-icon.png` | 1242 x 2436 px | PNG |
| Favicon | `favicon.png` | 48 x 48 px | PNG/ICO |
| Notification | `notification-icon.png` | 96 x 96 px | PNG |

**Note:** Expo will automatically resize your images during the build process to generate all required sizes (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi for Android, and all iOS sizes).

---

## 🎯 What Expo Does Automatically

When you run `eas build`, Expo will:

1. ✅ Take your 1024x1024 `icon.png`
2. ✅ Generate all required sizes for iOS (20pt-1024pt)
3. ✅ Generate all required sizes for Android (ldpi-xxxhdpi)
4. ✅ Create rounded corners for iOS
5. ✅ Create adaptive icon layers for Android
6. ✅ Optimize file sizes

**You just need to provide the source images!**

---

## 🚨 Common Issues

### "Asset not found" error
- Verify file names are **exactly** as shown above (case-sensitive)
- Check files are in `apps/mobile/assets/` directory
- Run `pnpm run verify-assets` to diagnose

### Splash screen doesn't appear
- Make sure `splash-icon.png` is a valid PNG file
- Check backgroundColor in app.json matches your design
- Try `npx expo start --clear` to clear cache

### App icon looks blurry
- Ensure source image is at least 1024 x 1024 px
- Use PNG format (not JPEG)
- Don't use already-compressed images

### Notification icon invisible on Android
- Android notifications prefer white icons on transparent background
- Simple silhouette shapes work best
- Avoid gradients or multiple colors

---

## 🎨 Pro Tips

### For Best Results:
1. **Use vector graphics** (export to 1024x1024 PNG)
2. **Transparent backgrounds** for adaptive icons
3. **High contrast** for notification icons
4. **Test on both light and dark themes**

### Color Scheme:
Your images use:
- 🔵 **Primary Blue:** `#4FA8C5` (cyan/teal)
- 🔴 **Accent Red:** `#EF4444` (red dot for alert)
- ⚫ **Dark Background:** `#1E293B` (slate)

These colors are already configured in:
- Tailwind config: `tailwind.config.js`
- App config: `app.json`
- Global styles: `src/global.css`

---

## ✨ Final Checklist

Before building APK:
- [ ] All 5 image files saved to `apps/mobile/assets/`
- [ ] Ran `pnpm run verify-assets` (all ✅)
- [ ] Tested splash screen in Expo Go
- [ ] Images are high quality (1024x1024 minimum)
- [ ] Ready to build: `eas build -p android --profile preview`

---

## 📞 Need Help?

If you encounter issues:
1. Check file names exactly match (case-sensitive)
2. Verify images are valid PNG files
3. Run `pnpm run verify-assets` for diagnostics
4. Check `apps/mobile/assets/README.md` for details

---

**Last Updated:** December 1, 2024  
**Status:** ✅ Configuration ready, waiting for image files  
**Next Step:** Save your 4 uploaded images to `apps/mobile/assets/` directory
