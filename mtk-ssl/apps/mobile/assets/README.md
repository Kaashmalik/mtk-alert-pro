# Assets Directory

This directory contains all app assets including icons, splash screens, and images.

## Required Assets

### Icons
- `icon.png` - App icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `notification-icon.png` - Notification icon (96x96px)
- `favicon.png` - Web favicon (48x48px)

### Splash Screen
- `splash.png` - Splash screen image (1242x2436px for iOS, 1080x1920px for Android)

## Asset Generation

You can generate these assets using:
- [Expo Asset Generator](https://www.npmjs.com/package/@expo/asset-generator)
- [App Icon Generator](https://www.appicon.co/)
- [Figma](https://www.figma.com/) with Expo plugin

## Quick Setup

```bash
# Install asset generator
npm install -g @expo/asset-generator

# Generate all assets from a single source image
asset-generator --input ./source-icon.png --output ./assets
```

## Design Guidelines

- Use green (#16a34a) as primary color
- Keep icons simple and recognizable
- Ensure splash screen matches app theme
- Test on both light and dark mode

