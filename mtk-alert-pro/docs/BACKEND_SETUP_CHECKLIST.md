# MTK AlertPro - Backend Setup & Verification Checklist

## ✅ Supabase Project Setup

### 1. Create Supabase Project
- [ ] Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Create new project (select closest region for performance)
- [ ] Copy Project URL and Anon Key
- [ ] Update `apps/mobile/.env`:
  ```bash
  EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 2. Run Database Migrations
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Copy content from `supabase/migrations/20241130000000_initial_schema.sql`
- [ ] Run the migration
- [ ] Verify tables created:
  - `profiles`
  - `cameras`
  - `alerts`
  - `detection_zones`

### 3. Enable Row Level Security (RLS)
- [ ] Verify RLS is enabled on all tables
- [ ] Test policies:
  ```sql
  -- Test: Users can only see their own data
  SELECT * FROM profiles WHERE id = auth.uid();
  SELECT * FROM cameras WHERE user_id = auth.uid();
  SELECT * FROM alerts WHERE user_id = auth.uid();
  ```

### 4. Configure Authentication
- [ ] Go to Authentication → Settings
- [ ] Enable Email Provider
- [ ] **Disable email confirmations** (for testing) OR configure SMTP
- [ ] Set Site URL: `mtkalertpro://` (for deep linking)
- [ ] Add Redirect URLs:
  - `mtkalertpro://reset-password`
  - `mtkalertpro://auth/callback`
  - `exp://localhost:8081` (for dev)
  - `http://localhost:8081` (for web dev)

### 5. Configure Custom Email Templates
- [ ] Go to Authentication → Email Templates
- [ ] **Confirm Signup** → Use template: `supabase/email-templates/confirm-signup.html`
- [ ] **Reset Password** → Use template: `supabase/email-templates/reset-password.html`
- [ ] Set "From" email: `noreply@mtkalertpro.com`
- [ ] Test email delivery

### 6. Setup Storage Buckets
- [ ] Go to Storage → Create Buckets:
  - `avatars` (for user profile pictures)
  - `camera-thumbnails` (for camera preview images)
  - `alert-snapshots` (for alert snapshots)
  - `alert-videos` (for alert video clips)

- [ ] Configure Bucket Policies:
  ```sql
  -- avatars: Users can upload/update own avatar
  CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

  CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

  CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
  ```

### 7. Test Backend Functionality

#### A. Test Authentication Flow
```bash
# From apps/mobile directory
npx expo start
```

- [ ] Open app in Expo Go
- [ ] **Register** new account
  - Verify user created in `auth.users` table
  - Verify profile created in `public.profiles` table
- [ ] **Login** with credentials
  - Verify token received
  - Verify session persisted
- [ ] **Logout** and verify session cleared
- [ ] **Password Reset** flow
  - Click "Forgot Password"
  - Enter email
  - Check email inbox for reset link
  - Click link and reset password

#### B. Test Database Operations
Open Supabase SQL Editor and run:

```sql
-- 1. Check if profiles are created automatically
SELECT * FROM profiles;

-- 2. Manually insert test camera (replace USER_ID with actual ID from profiles)
INSERT INTO cameras (user_id, name, rtsp_url, is_active)
VALUES (
  'YOUR_USER_ID_HERE',
  'Front Door Camera',
  'rtsp://admin:password@192.168.1.100:554/stream',
  true
);

-- 3. Verify RLS works (run this when logged in)
SELECT * FROM cameras;  -- Should only return cameras for logged-in user

-- 4. Insert test alert
INSERT INTO alerts (camera_id, user_id, type, confidence)
VALUES (
  (SELECT id FROM cameras LIMIT 1),
  'YOUR_USER_ID_HERE',
  'person',
  0.95
);

-- 5. Verify alerts show up
SELECT * FROM alerts WHERE user_id = auth.uid();
```

#### C. Test Realtime Subscriptions
In the app:
- [ ] Navigate to Alerts tab
- [ ] In Supabase Dashboard, manually insert a new alert
- [ ] Verify alert appears in app instantly (realtime subscription)

### 8. Environment Variables Checklist

**Production `.env` file:**
```bash
# Supabase (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase FCM (for push notifications - OPTIONAL for now)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project

# RevenueCat (for subscriptions - OPTIONAL for now)
EXPO_PUBLIC_REVENUECAT_API_KEY=your-revenuecat-key

# Sentry (for error tracking - OPTIONAL)
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn

# PostHog (for analytics - OPTIONAL)
EXPO_PUBLIC_POSTHOG_KEY=your-posthog-key

# App Environment
EXPO_PUBLIC_APP_ENV=production
```

---

## 🚀 Build Production APK

### Prerequisites
- [ ] Expo account created: [https://expo.dev/signup](https://expo.dev/signup)
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in: `eas login`

### Build Steps

1. **Configure EAS Build**
   ```bash
   cd apps/mobile
   eas build:configure
   ```

2. **Build Preview APK** (for testing)
   ```bash
   eas build --platform android --profile preview
   ```
   - Download APK when complete
   - Install on Android device
   - Test full functionality

3. **Build Production AAB** (for Google Play)
   ```bash
   eas build --platform android --profile production
   ```

### Test Production Build
- [ ] Install APK on device
- [ ] Test offline persistence (SecureStore saves credentials)
- [ ] Test notifications
- [ ] Test camera connection
- [ ] Test realtime alerts
- [ ] Test logout/login persistence

---

## 📧 Email Template Setup Instructions

### Using Supabase SMTP
1. Go to Supabase Dashboard → Project Settings → Auth
2. Enable Custom SMTP (recommended for production)
3. Use services like:
   - **SendGrid** (free 100 emails/day)
   - **Mailgun** (free 5,000 emails/month)
   - **AWS SES** (very cheap)
   - **Resend** (modern, developer-friendly)

### Apply Custom Templates
1. Copy content from:
   - `supabase/email-templates/confirm-signup.html`
   - `supabase/email-templates/reset-password.html`

2. Go to: Authentication → Email Templates

3. For **Confirm Signup**:
   - Paste HTML
   - Replace `{{ .ConfirmationURL }}` placeholders
   - Test with new signup

4. For **Reset Password**:
   - Paste HTML
   - Replace `{{ .ConfirmationURL }}` placeholders
   - Test password reset flow

---

## ✅ Final Pre-Launch Checklist

### Security
- [ ] RLS enabled on all tables
- [ ] Storage bucket policies configured
- [ ] Service role key never exposed in client
- [ ] Environment variables secured
- [ ] HTTPS enforced for all requests

### Functionality
- [ ] User registration works
- [ ] Email confirmation works
- [ ] Login/logout works
- [ ] Password reset works
- [ ] Camera CRUD operations work
- [ ] Alerts are created and displayed
- [ ] Realtime subscriptions work
- [ ] Notifications work
- [ ] App persists session offline

### Performance
- [ ] Images optimized
- [ ] API calls batched where possible
- [ ] Indexes created on frequently queried columns
- [ ] Cache strategies implemented

### Compliance
- [ ] Privacy Policy created
- [ ] Terms of Service created
- [ ] GDPR compliance (if targeting EU)
- [ ] Data deletion endpoint available

---

## 🐛 Common Issues & Fixes

### Issue: "Invalid API key"
**Fix:** Double-check `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`

### Issue: "RLS policy violation"
**Fix:** Ensure user is authenticated and policies allow the operation

### Issue: "Email not sending"
**Fix:** Enable Custom SMTP in Supabase settings

### Issue: "App not persisting login"
**Fix:** Verify `SecureStore` is working (requires physical device or simulator, not Expo Go)

### Issue: "Realtime not working"
**Fix:** Check if table has `REPLICA IDENTITY FULL` enabled:
```sql
ALTER TABLE alerts REPLICA IDENTITY FULL;
```

---

## 📞 Support

If you encounter issues:
1. Check Supabase Logs: Dashboard → Logs
2. Check app console: `npx expo start` terminal output
3. Test with Postman/curl to isolate frontend vs backend
4. Reach out: support@mtkalertpro.com

---

**Last Updated:** December 1, 2024  
**Version:** 1.0.0
