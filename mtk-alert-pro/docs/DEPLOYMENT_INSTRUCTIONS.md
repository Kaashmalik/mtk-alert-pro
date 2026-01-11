# MTK AlertPro - Final Deployment Instructions

**Project**: MTK AlertPro
**Version**: 1.0.0
**Last Updated**: January 11, 2026

---

## Prerequisites

### Required Accounts & Services

- [ ] Expo account (EAS)
- [ ] Supabase account
- [ ] Google Play Console account
- [ ] Sentry account (optional but recommended)
- [ ] Firebase account (for FCM - optional)

### Required Tools

- Node.js 20.18.0+
- pnpm or npm
- Git
- Expo CLI
- EAS CLI

```bash
npm install -g eas-cli
npm install -g expo-cli
```

---

## Step 1: Security Configuration

### 1.1 Rotate Supabase Keys

**CRITICAL**: Do this BEFORE any deployment

1. Go to Supabase Dashboard → Settings → API
2. Click "Rotate" on the anon key
3. Copy the new anon key
4. (Optional) Rotate service_role key if compromised

### 1.2 Generate New Encryption Key

```bash
openssl rand -base64 32
```

Copy the output - this is your new `EXPO_PUBLIC_ENCRYPTION_KEY`.

### 1.3 Configure EAS Secrets

Navigate to `apps/mobile` directory:

```bash
cd apps/mobile
```

Set secrets for production:

```bash
# Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-new-anon-key"

# Encryption
eas secret:create --scope project --name EXPO_PUBLIC_ENCRYPTION_KEY --value "your-new-encryption-key"

# Optional: Sentry
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://your-sentry-dsn"

# Optional: Firebase
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
```

**Verify secrets**:
```bash
eas secrets:list --scope project
```

### 1.4 Update Local .env (Development Only)

Create/update `apps/mobile/.env`:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key

# Encryption
EXPO_PUBLIC_ENCRYPTION_KEY=your-new-encryption-key

# Optional: Sentry
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# App Config
EXPO_PUBLIC_APP_ENV=development
```

**IMPORTANT**: Never commit `.env` to git!

---

## Step 2: Build Configuration

### 2.1 Verify EAS Configuration

Check `apps/mobile/eas.json`:

```json
{
  "build": {
    "production": {
      "extends": "base",
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  }
}
```

### 2.2 Verify App Configuration

Check `apps/mobile/app.json`:

- Version: `1.0.0`
- Bundle ID: `com.mtk.alertpro`
- All permissions documented
- Privacy policy URL set (if available)

---

## Step 3: Optional: Certificate Pinning

### 3.1 Get Certificate Hashes

For each pinned domain (e.g., Supabase):

```bash
openssl s_client -showcerts -connect your-project.supabase.co:443 </dev/null 2>/dev/null | openssl x509 -pubkey -noout -fingerprint -sha256 -
```

### 3.2 Configure Certificate Hashes

Edit `apps/mobile/src/lib/security/certificatePinning.ts`:

```typescript
const PINNED_CERTIFICATES: PinnedCertificate[] = [
  {
    domain: 'supabase.co',
    sha256Hashes: [
      'YOUR_ACTUAL_CERT_HASH_1',
      'YOUR_ACTUAL_CERT_HASH_2',
    ],
    isProduction: true,
  },
];
```

---

## Step 4: Build & Test

### 4.1 Development Build (Local Testing)

```bash
cd apps/mobile
eas build --profile development --platform android
```

Test the development build:
- [ ] Sign in works
- [ ] Camera addition works
- [ ] Streaming works
- [ ] Detection works
- [ ] Offline mode works

### 4.2 Preview Build (Beta Testing)

```bash
cd apps/mobile
eas build --profile preview --platform android
```

Download the APK and distribute to beta testers:
- [ ] Test with 5+ cameras
- [ ] Test offline mode
- [ ] Test background/foreground transitions
- [ ] Test for 4+ hours continuous use

### 4.3 Production Build

```bash
cd apps/mobile
eas build --profile production --platform android
```

This creates an AAB file for Play Store submission.

---

## Step 5: Store Preparation

### 5.1 Google Play Console

1. **Create App**
   - Go to Google Play Console
   - Create new app
   - Enter app name: "MTK AlertPro"

2. **Store Listing**
   - Upload screenshots (minimum 2, recommended 5-8)
   - Upload feature graphic (1024x500)
   - Upload app icon (512x512)
   - Write short description (80 chars max)
   - Write full description
   - Add keywords

3. **Content Rating**
   - Complete content rating questionnaire
   - Expected rating: Teen (due to camera monitoring)

4. **Privacy Policy**
   - Upload privacy policy URL
   - Ensure policy covers:
     - Camera access
     - Data collection
     - Data usage
     - Third-party services

5. **App Access**
   - Set up app access for internal testing
   - Add tester email addresses

### 5.2 Store Listing Template

**Short Description**:
```
AI-powered security camera monitoring with real-time alerts and offline support.
```

**Full Description**:
```
MTK AlertPro transforms your security cameras into an intelligent monitoring system with AI-powered person and vehicle detection.

KEY FEATURES:
• Real-time RTSP camera streaming
• AI-powered person and vehicle detection
• Instant alerts on suspicious activity
• Offline mode - monitor without internet
• Multiple camera support
• Secure encrypted storage
• Background monitoring
• Custom detection zones

PERFECT FOR:
• Home security monitoring
• Business surveillance
• Remote property monitoring
• Baby monitoring
• Pet monitoring

PRIVACY & SECURITY:
• End-to-end encryption
• Secure token storage
• No data sharing with third parties
• Works offline - your data stays on your device

Download MTK AlertPro and take control of your security today!
```

---

## Step 6: Deployment

### 6.1 Internal Testing

1. Upload production AAB to Play Console
2. Create internal testing track
3. Add testers
4. Monitor for 7 days

### 6.2 Closed Testing

1. Create closed testing track
2. Add up to 100 testers
3. Gather feedback
4. Fix any critical issues

### 6.3 Open Testing

1. Create open testing track
2. Make available to public
3. Monitor crash rates
4. Monitor user feedback

### 6.4 Production Release

1. Create production release
2. Upload AAB
3. Set release notes
4. Submit for review
5. Wait for approval (1-3 days)

---

## Step 7: Post-Deployment Monitoring

### 7.1 Sentry Setup (If Using)

1. Create Sentry project
2. Configure DSN in EAS secrets
3. Verify error reporting
4. Set up alerts for:
   - Crash rate > 1%
   - Error rate > 5%
   - Critical errors

### 7.2 Supabase Monitoring

1. Monitor database connections
2. Monitor storage usage
3. Monitor edge function calls
4. Set up alerts for:
   - High error rates
   - Slow queries
   - Storage limits

### 7.3 Performance Monitoring

Monitor:
- App startup time
- Stream latency
- Detection accuracy
- Memory usage
- Battery drain
- Crash-free users

---

## Step 8: Rollback Procedures

### 8.1 Emergency Feature Disable

If critical issues are discovered:

1. Use Supabase to disable features:
   ```sql
   UPDATE profiles SET detection_enabled = false WHERE id = 'user_id';
   ```

2. Use feature flags if implemented

3. Communicate with users via in-app notifications

### 8.2 Hotfix Process

1. Fix issue in development
2. Test thoroughly
3. Build new version:
   ```bash
   eas build --profile production --platform android
   ```
4. Submit expedited review
5. Deploy to production

### 8.3 Emergency Rollback

If severe issues require immediate rollback:

1. Unpublish app from Play Store
2. Communicate with users
3. Fix issues
4. Submit new version
5. Republish

---

## Troubleshooting

### Build Fails

**Issue**: Build fails with "Secret not found"
**Solution**:
```bash
eas secrets:list --scope project
# Verify all required secrets are set
```

**Issue**: Build fails with "Certificate pinning error"
**Solution**: Check certificate hashes in `certificatePinning.ts`

### App Crashes on Startup

**Issue**: App crashes immediately
**Solution**:
1. Check Sentry for error details
2. Verify EAS secrets are set correctly
3. Check encryption key format

### Authentication Issues

**Issue**: Users cannot sign in
**Solution**:
1. Verify Supabase anon key is correct
2. Check Supabase project status
3. Verify auth configuration

### Streaming Issues

**Issue**: Camera streams won't connect
**Solution**:
1. Check RTSP URL format
2. Verify network connectivity
3. Check media server configuration

---

## Contact & Support

### Internal Resources

- **Phase 2 Audit Report**: `docs/PHASE_2_SECURITY_AUDIT_REPORT.md`
- **Phase 3 Checklist**: `docs/PHASE_3_HARDENING_CHECKLIST.md`
- **Production Readiness Report**: `docs/PHASE_3_PRODUCTION_READINESS_REPORT.md`

### External Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Play Console](https://play.google.com/console)

---

## Checklist Summary

### Pre-Deployment
- [ ] Supabase keys rotated
- [ ] Encryption key generated
- [ ] EAS secrets configured
- [ ] Certificate hashes configured (optional)
- [ ] Sentry project set up (optional)
- [ ] Privacy policy published
- [ ] Store assets prepared

### Build & Test
- [ ] Development build tested
- [ ] Preview build tested
- [ ] Production build created
- [ ] Beta testing completed
- [ ] Critical issues resolved

### Deployment
- [ ] Internal testing completed
- [ ] Closed testing completed
- [ ] Open testing completed
- [ ] Production release submitted
- [ ] Monitoring active

---

**Deployment Instructions Version**: 1.0
**Last Updated**: January 11, 2026
