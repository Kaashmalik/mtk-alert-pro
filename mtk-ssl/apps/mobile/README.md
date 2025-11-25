# Shakir Super League Mobile App

Native mobile app for Shakir Super League built with Expo React Native.

## Features

- ✅ **Offline Scoring + Sync**: Score matches offline and sync when online
- ✅ **Push Notifications**: Get notified for wickets and match starts
- ✅ **Live Score Following**: Real-time match updates
- ✅ **Player Profiles**: View player statistics and information
- ✅ **Deep Linking**: `ssl.cricket/match/abc` opens the app
- ✅ **App Install Prompt**: PWA fallback for web
- ✅ **Urdu + English**: Full i18n support with RTL/LTR
- ✅ **App Store Ready**: Configured for iOS and Android submission
- ✅ **EAS Build + OTA Updates**: Over-the-air updates support

## Design

Clean, modern UI inspired by Cricbuzz with:
- Green color scheme (#16a34a)
- Card-based layouts
- Live match indicators
- Offline status badges
- Smooth animations

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Or use Expo CLI directly
cd apps/mobile
expo start
```

### Environment Variables

Create a `.env` file in `apps/mobile/`:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
```

## Development

### Running on Device

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web (for testing)
pnpm web
```

### Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   ├── matches.tsx        # Matches list
│   ├── match/[matchId].tsx # Match details
│   ├── player/[playerId].tsx # Player profile
│   └── settings.tsx       # Settings
├── src/
│   ├── lib/               # Utilities
│   │   ├── supabase.ts    # Supabase client
│   │   ├── i18n.ts        # i18n configuration
│   │   └── deep-linking.ts # Deep link handler
│   ├── store/             # Zustand stores
│   │   ├── match-store.ts
│   │   └── offline-store.ts
│   ├── hooks/             # Custom hooks
│   │   ├── use-offline-sync.ts
│   │   └── use-push-notifications.ts
│   └── services/          # Services
│       └── notifications.ts
├── app.config.js          # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json
```

## Building

### Development Build

```bash
# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build

```bash
# Build for production
eas build --profile production --platform all
```

### Preview Build (Internal Testing)

```bash
eas build --profile preview --platform all
```

## Submitting to Stores

### iOS (App Store)

```bash
# Build and submit
eas build --profile production --platform ios
eas submit --platform ios --profile production
```

### Android (Play Store)

```bash
# Build and submit
eas build --profile production --platform android
eas submit --platform android --profile production
```

## OTA Updates

### Publish Update

```bash
# Publish to production
eas update --branch production --message "Bug fixes and improvements"

# Publish to preview
eas update --branch preview --message "Preview update"
```

### Update Configuration

Updates are configured in `app.config.js`:

```javascript
updates: {
  url: "https://u.expo.dev/your-project-id"
},
runtimeVersion: {
  policy: "appVersion"
}
```

## Deep Linking

The app supports deep linking in the following formats:

- `ssl.cricket/match/abc` → Opens match screen
- `ssl://match/abc` → Opens match screen
- `ssl.cricket/player/abc` → Opens player profile

Configured in `app.config.js`:

```javascript
scheme: "ssl",
android: {
  intentFilters: [
    {
      action: "VIEW",
      data: [
        { scheme: "https", host: "ssl.cricket", pathPrefix: "/match" },
        { scheme: "ssl" }
      ]
    }
  ]
}
```

## Push Notifications

### Setup

1. Configure Expo Push Notification service
2. Set `EXPO_PUBLIC_PROJECT_ID` in environment
3. Register device token with backend

### Usage

Notifications are automatically sent for:
- Match start
- Wickets
- Match updates (configurable)

## Offline Support

The app uses:
- **AsyncStorage** for offline data persistence
- **Zustand** with persistence middleware
- **Automatic sync** when connection is restored

## Internationalization

Supports:
- **English** (en)
- **Urdu** (ur) with RTL support

Language preference is saved and persists across app restarts.

## Testing

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Troubleshooting

### Metro bundler issues

```bash
# Clear cache
expo start -c
```

### Build failures

```bash
# Clear EAS build cache
eas build --clear-cache
```

### Push notifications not working

1. Ensure device is physical (not simulator)
2. Check permissions are granted
3. Verify `EXPO_PUBLIC_PROJECT_ID` is set

## Support

- Documentation: https://docs.ssl.cricket
- Email: support@ssl.cricket

---

**Shakir Super League** — Built with ❤️ by Malik Tech (MTK)
