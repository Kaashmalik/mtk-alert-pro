# Phase 6: Launch (Week 12)

## Goals
- ✅ Google Play Store assets
- ✅ Production build & signing
- ✅ Store submission
- ✅ Landing page deployment
- ✅ Monitoring setup
- ✅ Launch day checklist

---

## Step 1: App Signing Setup

### Generate Upload Key
```bash
cd apps/mobile/android

# Generate keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore mtk-alertpro-upload.keystore \
  -alias mtkalertpro \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Store password securely - NEVER commit to git
```

### `apps/mobile/android/gradle.properties`
```properties
# Add these (values from .env or CI secrets)
MTK_UPLOAD_STORE_FILE=mtk-alertpro-upload.keystore
MTK_UPLOAD_STORE_PASSWORD=****
MTK_UPLOAD_KEY_ALIAS=mtkalertpro
MTK_UPLOAD_KEY_PASSWORD=****
```

### `apps/mobile/android/app/build.gradle`
```groovy
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MTK_UPLOAD_STORE_FILE')) {
                storeFile file(MTK_UPLOAD_STORE_FILE)
                storePassword MTK_UPLOAD_STORE_PASSWORD
                keyAlias MTK_UPLOAD_KEY_ALIAS
                keyPassword MTK_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 2: Production Build

### Using EAS Build (Recommended)
```bash
# Login to Expo
eas login

# Configure secrets
eas secret:create --name SENTRY_DSN --value "your-dsn"
eas secret:create --name SUPABASE_URL --value "your-url"
eas secret:create --name SUPABASE_ANON_KEY --value "your-key"

# Build production AAB
eas build --platform android --profile production

# Download AAB when complete
eas build:list --platform android
```

### Manual Build (Alternative)
```bash
cd apps/mobile/android

# Clean build
./gradlew clean

# Build release AAB
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Step 3: Google Play Store Assets

### Required Assets Checklist

| Asset | Specification | Status |
|-------|--------------|--------|
| App Icon | 512x512 PNG | ⬜ |
| Feature Graphic | 1024x500 PNG | ⬜ |
| Phone Screenshots (8) | 16:9 or 9:16 | ⬜ |
| Tablet Screenshots (optional) | 16:9 | ⬜ |
| Short Description | 80 chars max | ⬜ |
| Full Description | 4000 chars max | ⬜ |
| Privacy Policy URL | Required | ⬜ |
| App Category | Tools / House & Home | ⬜ |
| Content Rating | Complete questionnaire | ⬜ |
| Target Audience | 18+ | ⬜ |

### Screenshot Specifications
```
Phone: 1080x1920 or 1080x2340 (with notch)
Format: PNG or JPEG
Min: 2 screenshots
Max: 8 screenshots

Recommended:
1. Dashboard overview
2. Camera live view
3. AI detection in action
4. Alert notification
5. Alert history
6. Camera compatibility
7. Settings screen
8. Pro features
```

### Store Listing Copy

**App Title** (30 chars):
```
MTK AlertPro - AI Security
```

**Short Description** (80 chars):
```
AI CCTV alerts for Hikvision, Dahua, Reolink. Smart detection, instant notify.
```

**Full Description**: See `plane.md` lines 575-693

---

## Step 4: Privacy Policy & Terms

### `docs/legal/PRIVACY_POLICY.md`
```markdown
# Privacy Policy for MTK AlertPro

Last Updated: [Date]

## Information We Collect

### Account Information
- Email address
- Display name (optional)

### Camera Data
- Camera names and RTSP URLs (encrypted)
- Camera credentials (encrypted, never transmitted)

### Detection Data
- Alert snapshots (stored locally or in your cloud)
- Alert metadata (type, timestamp, camera ID)

### Analytics Data
- App usage patterns (anonymized)
- Crash reports (via Sentry)
- Feature usage statistics

## How We Use Information

- Provide app functionality
- Improve detection accuracy
- Send push notifications
- Customer support

## Data Storage

- **Local Storage**: Alert history, recordings (48h free tier)
- **Cloud Storage**: Supabase (encrypted, user-scoped)
- **Location**: [Your region] data centers

## Data Sharing

We do NOT:
- Sell your personal data
- Share camera footage with third parties
- Access your cameras without permission

We DO share with:
- Supabase (database hosting)
- Sentry (error tracking)
- PostHog (analytics)

## Your Rights

- Access your data
- Delete your account
- Export your data
- Opt-out of analytics

## Contact

support@mtkalertpro.com

## GDPR Compliance

[If applicable, add GDPR-specific clauses]
```

---

## Step 5: Google Play Console Submission

### Pre-Submission Checklist

```markdown
## App Content
- [ ] App title, descriptions, screenshots uploaded
- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] App category selected (Tools)
- [ ] Content rating questionnaire completed
- [ ] Target audience declared (18+)

## Store Presence
- [ ] Privacy policy URL added
- [ ] Email for support added
- [ ] Website URL added (optional)

## Release
- [ ] AAB file uploaded
- [ ] Release notes written
- [ ] Countries/regions selected
- [ ] Pricing set (Free with IAP)

## Policy Compliance
- [ ] Data safety form completed
- [ ] Ads declaration (contains ads: No)
- [ ] Permissions explained
- [ ] App access instructions (if needed for review)
```

### Release Notes Template
```
🚀 MTK AlertPro v1.0.0 - Initial Release

What's New:
• AI-powered person & vehicle detection
• Works with 80% of IP cameras (Hikvision, Dahua, Reolink, etc.)
• Instant push notifications with snapshots
• Red Alert mode for maximum sensitivity
• 48-hour local alert history
• Manual 10-second video recording
• Dark mode interface

Coming Soon:
• Face recognition (Pro)
• Custom detection zones (Pro)
• Cloud backup (Pro)

Download now and transform your cameras into smart security!
```

---

## Step 6: Landing Page Deployment

### Deploy to Vercel
```bash
# Create landing page project
cd ..
npx create-next-app@latest mtk-landing --typescript --tailwind --app

cd mtk-landing

# Install dependencies
pnpm add lucide-react @radix-ui/react-accordion

# Deploy
vercel --prod
```

### Key Landing Page Sections
1. **Hero**: "Turn Any IP Camera Into An AI Security System"
2. **Features**: AI detection, compatibility, privacy
3. **How It Works**: 3 simple steps
4. **Pricing**: Free / Pro / Business tiers
5. **Compatible Cameras**: Brand logos + search
6. **FAQ**: Common questions
7. **Download CTA**: Google Play badge

---

## Step 7: Monitoring & Alerts

### Sentry Alerts Configuration
```javascript
// sentry.io dashboard settings
{
  "alerts": [
    {
      "name": "High Error Rate",
      "condition": "error_rate > 1%",
      "action": "email + slack"
    },
    {
      "name": "New Issue",
      "condition": "new_issue",
      "action": "email"
    },
    {
      "name": "Crash Spike",
      "condition": "crash_rate > 0.5%",
      "action": "email + sms"
    }
  ]
}
```

### Supabase Monitoring
- Enable database metrics
- Set up storage usage alerts
- Monitor auth events
- Track API request rates

### PostHog Dashboards
Create dashboards for:
- Daily/Weekly Active Users
- Camera additions per day
- Alert generation rate
- Pro conversion funnel
- Retention curves

---

## Step 8: Launch Day Checklist

### T-7 Days (Pre-Launch)
- [ ] Final QA pass complete
- [ ] All store assets uploaded
- [ ] Privacy policy published
- [ ] Landing page live
- [ ] Email sequences ready
- [ ] Social media scheduled

### T-1 Day (Day Before)
- [ ] Submit app to Google Play
- [ ] Test download from internal track
- [ ] Verify push notifications work
- [ ] Verify Supabase is production-ready
- [ ] Backup database schema
- [ ] Team on standby

### Launch Day (T-0)
- [ ] Promote to production track
- [ ] Publish landing page updates
- [ ] Post on social media
- [ ] Send launch email
- [ ] Monitor Sentry for errors
- [ ] Monitor Play Console for crashes
- [ ] Respond to early reviews

### T+1 Day (Day After)
- [ ] Review analytics
- [ ] Check error rates
- [ ] Respond to support emails
- [ ] Fix any critical bugs
- [ ] Thank early adopters

---

## Step 9: Post-Launch Metrics

### Week 1 Targets
| Metric | Target |
|--------|--------|
| Installs | 100+ |
| DAU | 50+ |
| Crash-free rate | > 99% |
| Avg rating | > 4.0 |
| Camera adds | 2 per user |

### Month 1 Targets
| Metric | Target |
|--------|--------|
| Total Installs | 1,000+ |
| DAU | 200+ |
| Day 7 Retention | > 30% |
| Reviews | 50+ |
| Pro Trials | 50+ |

---

## Step 10: Support Infrastructure

### Help Center Structure
```
help.mtkalertpro.com/
├── getting-started/
│   ├── installation
│   ├── adding-first-camera
│   └── understanding-alerts
├── cameras/
│   ├── finding-rtsp-url
│   ├── hikvision-setup
│   ├── dahua-setup
│   └── troubleshooting
├── detection/
│   ├── how-ai-works
│   ├── reducing-false-alarms
│   └── red-alert-mode
├── account/
│   ├── subscription
│   ├── privacy
│   └── delete-account
└── faq/
```

### Support Email Templates
```markdown
## Welcome Email
Subject: Welcome to MTK AlertPro! 🚨

## Setup Help
Subject: Need help connecting your camera?

## Trial Started
Subject: Your Pro trial has started! Here's what you can do...

## Trial Ending
Subject: Your Pro trial ends in 2 days
```

---

## 🎉 Launch Complete Checklist

- [ ] App live on Google Play Store
- [ ] Landing page deployed
- [ ] Analytics tracking verified
- [ ] Error tracking active
- [ ] Support channels ready
- [ ] Social media announced
- [ ] First reviews received
- [ ] No critical bugs reported

---

## What's Next?

### Version 1.1 (Month 2)
- Bug fixes from user feedback
- Performance improvements
- Additional camera brand support

### Version 1.5 (Month 4-5)
- Pro tier launch
- Face recognition
- Custom detection zones
- Cloud backup

### Version 2.0 (Month 6-7)
- Business tier
- Web dashboard
- API access
- License plate recognition

---

## Congratulations! 🚀

You've successfully launched MTK AlertPro. Now focus on:

1. **User Feedback**: Read every review and email
2. **Bug Fixes**: Address issues quickly
3. **Feature Iteration**: Build what users want
4. **Growth**: Optimize store listing, add marketing

Remember: **Ship fast, iterate faster!**

---

*Built with ❤️ by MTK CODEX*
