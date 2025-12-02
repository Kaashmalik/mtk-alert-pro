# 🚨 MTK AlertPro

**Smart Alerts, Safer Homes** - AI-Powered CCTV Security for Everyone

[![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📱 About

MTK AlertPro transforms any IP camera into an intelligent security system with:

- 🧠 **On-device AI** - Person & vehicle detection using Google ML Kit
- 🔔 **Smart Alerts** - Instant push notifications, no false alarms
- 🔒 **Privacy-First** - All processing happens on your device
- 📹 **Universal Compatibility** - Works with 80%+ of IP cameras
- ⚡ **Real-time** - < 2 second alert latency

---

## 🚀 Quick Start

```bash
# Prerequisites
node -v  # v20+
pnpm -v  # v9+

# Clone & Install
git clone https://github.com/Kaashmalik/mtk-alert-pro.git
cd mtk-alert-pro
pnpm install

# Setup environment
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env with your Supabase & Firebase credentials

# Start development
pnpm dev

# Run on Android
pnpm android
```

---

## 📂 Project Structure

```
mtk-alert-pro/
├── apps/mobile/          # React Native app
├── packages/shared/      # Shared types & utilities
├── supabase/             # Database migrations & edge functions
├── docs/                 # Documentation
│   └── phases/           # Implementation phases
└── .github/workflows/    # CI/CD
```

---

## 📋 Implementation Phases

| Phase | Focus | Duration |
|-------|-------|----------|
| [Phase 0](docs/phases/PHASE_0_SETUP.md) | Environment Setup | Day 0 |
| [Phase 1](docs/phases/PHASE_1_FOUNDATION.md) | Auth & Navigation | Week 1-2 |
| [Phase 2](docs/phases/PHASE_2_CAMERAS.md) | Camera Integration | Week 3-4 |
| [Phase 3](docs/phases/PHASE_3_AI_ML.md) | AI/ML Detection | Week 5-7 |
| [Phase 4](docs/phases/PHASE_4_FEATURES.md) | Core Features | Week 8-9 |
| [Phase 5](docs/phases/PHASE_5_POLISH.md) | Testing & Polish | Week 10-11 |
| [Phase 6](docs/phases/PHASE_6_LAUNCH.md) | Store Launch | Week 12 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Language | TypeScript 5.6 |
| State | Zustand 5 + TanStack Query 5 |
| Styling | NativeWind 4 (Tailwind) |
| Backend | Supabase (Auth, DB, Storage) |
| AI/ML | Google ML Kit |
| Notifications | Firebase Cloud Messaging |
| Payments | RevenueCat |

---

## 💰 Business Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 2 cameras, Person/Vehicle detection, 48h history |
| **Pro** | $3.99/mo | Unlimited cameras, Face recognition, Cloud backup |
| **Business** | $14.99/mo | 50GB storage, License plates, API access |

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| APK Size | < 50MB |
| Cold Start | < 3 seconds |
| Detection Latency | < 500ms |
| Detection Accuracy | > 85% |
| Crash-Free Rate | > 99.5% |

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# With coverage
pnpm test:coverage

# E2E tests (Maestro)
pnpm test:e2e
```

---

## 📦 Building

```bash
# Development APK
pnpm build:android:dev

# Production AAB (for Play Store)
pnpm build:android:prod
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 📞 Support

- 📧 Email: support@mtkalertpro.com
- 📖 Docs: help.mtkalertpro.com
- 💬 Discord: discord.gg/mtkalertpro

---

**Built with ❤️ by MTK CODEX**

*Last Updated: November 2025*
