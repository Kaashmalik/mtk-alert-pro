# Phase 3 Production Hardening Checklist

## Overview
This checklist validates production-grade security, stability, observability, and scalability for MTK AlertPro release.

---

## 🔐 SECURITY HARDENING

### 1. Final Security Checks

#### 1.1 Secrets Management
- [ ] All secrets sourced from EAS secrets only
- [ ] No secrets in `.env` files committed to git
- [ ] No secrets in `app.json` `extra` section
- [ ] No secrets in source code
- [ ] EAS secrets configured for production builds
- [ ] Secrets rotated (Supabase, encryption key)

**Verification Commands:**
```bash
# Check for secrets in git
git grep -i "supabase" apps/mobile/src --exclude-dir=node_modules
git grep -i "eyJhbGci" apps/mobile/src --exclude-dir=node_modules
git grep -i "EXPO_PUBLIC" apps/mobile/src --exclude-dir=node_modules

# Check app.json for secrets
grep -A 20 '"extra"' apps/mobile/app.json

# Verify EAS secrets
eas secrets:list --scope project
```

**Files to Review:**
- `apps/mobile/app.json` - `extra` section should have placeholders only
- `apps/mobile/.env` - Should not exist in git
- `apps/mobile/src/lib/supabase/client.ts` - No hardcoded credentials

---

#### 1.2 Fallback Keys & Dev Flags
- [ ] No fallback keys in encryption.ts
- [ ] No mock Supabase client in production
- [ ] No `__DEV__` checks that allow insecure behavior
- [ ] Development-only code paths removed from production builds
- [ ] No "test" or "demo" credentials

**Verification Steps:**
1. Search for fallback patterns:
   ```bash
   grep -r "fallback" apps/mobile/src --exclude-dir=node_modules
   grep -r "placeholder" apps/mobile/src --exclude-dir=node_modules
   grep -r "mock" apps/mobile/src --exclude-dir=node_modules
   ```

2. Check encryption.ts for dev-only code

3. Verify Supabase client has no mock fallback in production

**Test Cases:**
- [ ] Production build fails without proper secrets
- [ ] No fallback authentication works
- [ ] No test data appears in production

---

#### 1.3 Certificate Pinning
- [ ] Certificate pinning implemented for API requests
- [ ] Certificate pinning implemented for RTSP endpoints
- [ ] Certificate hashes properly configured
- [ ] Pinning bypass only in development
- [ ] Certificate rotation plan documented

**Verification Steps:**
1. Check `apps/mobile/src/lib/supabase/client.ts` for pinning implementation
2. Check `apps/mobile/src/lib/camera/rtspStreamingService.ts` for RTSP pinning
3. Verify certificate hashes are correct

**Test Cases:**
- [ ] API requests fail with MITM certificates
- [ ] RTSP connections fail with invalid certificates
- [ ] Production requests succeed with valid certificates

**Note**: Requires `react-native-networking` or similar package.

---

### 2. Auth & Session Hardening

#### 2.1 Token Refresh Validation
- [ ] Token refresh works after long background sessions (>1 hour)
- [ ] Token refresh works after network flapping
- [ ] Token refresh retries on transient failures
- [ ] Token refresh timeout configured appropriately
- [ ] Session expiration handled gracefully

**Test Cases:**
- [ ] App backgrounded for 2 hours, token refreshes on foreground
- [ ] Network toggles 10 times, token refresh succeeds
- [ ] Token refresh fails after 5 retries, user logged out
- [ ] Session expired shows appropriate error message

---

#### 2.2 Forced Logout on Refresh Failure
- [ ] Token refresh failure triggers forced logout
- [ ] User notified of logout reason
- [ ] Sensitive data cleared on logout
- [ ] User redirected to login screen
- [ ] Logout state persisted across app restart

**Verification Steps:**
1. Check auth store for refresh failure handling
2. Verify logout clears all sensitive data
3. Test with expired/invalid tokens

**Test Cases:**
- [ ] Invalid token triggers logout
- [ ] Network timeout during refresh triggers logout
- [ ] User can log back in after forced logout

---

#### 2.3 Token Replay Protection
- [ ] Token reuse detected and prevented
- [ ] Stale tokens rejected
- [ ] Token rotation on each refresh
- [ ] Session ID validation
- [ ] IP address change detection (optional)

**Verification Steps:**
1. Check Supabase auth configuration
2. Verify token validation logic
3. Test with replayed tokens

---

## 📊 OBSERVABILITY & MONITORING

### 3. Crash & Error Monitoring

#### 3.1 Sentry Integration
- [ ] Sentry properly initialized
- [ ] Source maps uploaded for production builds
- [ ] Release tagging configured
- [ ] Environment separation (dev/staging/prod)
- [ ] User context captured
- [ ] Device context captured
- [ ] Breadcrumbs for navigation
- [ ] Performance monitoring enabled

**Verification Steps:**
1. Check `apps/mobile/src/app/_layout.tsx` for Sentry init
2. Verify Sentry DSN is from EAS secrets
3. Check EAS build config for source map upload

**Test Cases:**
- [ ] Errors appear in Sentry dashboard
- [ ] Source maps resolve stack traces
- [ ] User context is captured
- [ ] Environment is correctly tagged

---

#### 3.2 RTSP Failure Monitoring
- [ ] RTSP connection failures logged
- [ ] RTSP timeout events logged
- [ ] RTSP quality degradation logged
- [ ] RTSP reconnection attempts tracked
- [ ] RTSP error context captured

**Verification Steps:**
1. Check `apps/mobile/src/lib/camera/rtspStreamingService.ts`
2. Verify error logging with context
3. Test with failing RTSP connections

**Test Cases:**
- [ ] Connection failures appear in monitoring
- [ ] Timeout events are logged
- [ ] Quality changes are tracked

---

#### 3.3 ML Inference Error Monitoring
- [ ] TensorFlow.js initialization failures logged
- [ ] Model loading failures logged
- [ ] Inference errors logged
- [ ] Memory leak warnings logged
- [ ] Performance degradation logged

**Verification Steps:**
1. Check `apps/mobile/src/features/detection/detectionService.ts`
2. Check `apps/mobile/src/features/detection/detectionManager.ts`
3. Verify error handling and logging

**Test Cases:**
- [ ] Model load failures are logged
- [ ] Inference errors are captured
- [ ] Memory warnings are reported

---

#### 3.4 Background Task Crash Monitoring
- [ ] Background task crashes logged
- [ ] Task timeout events logged
- [ ] Task restart attempts tracked
- [ ] Background state transitions logged

**Verification Steps:**
1. Check background task implementations
2. Verify error handling
3. Test with background crashes

---

### 4. Performance Monitoring

#### 4.1 Frame Drop Tracking
- [ ] Frame drops counted
- [ ] Frame rate monitored
- [ ] Frame drop threshold configured
- [ ] Alerts for excessive drops

**Verification Steps:**
1. Check streaming service for frame tracking
2. Verify metrics collection

**Test Cases:**
- [ ] Frame drops are counted accurately
- [ ] Alerts trigger on excessive drops

---

#### 4.2 RTSP Latency Tracking
- [ ] Connection latency measured
- [ ] Stream latency measured
- [ ] Latency thresholds configured
- [ ] Alerts for high latency

**Verification Steps:**
1. Check RTSP service for latency tracking
2. Verify metrics collection

**Test Cases:**
- [ ] Latency is measured accurately
- [ ] High latency triggers alerts

---

#### 4.3 ML Inference Time Tracking
- [ ] Inference time measured
- [ ] Model load time measured
- [ ] Performance thresholds configured
- [ ] Alerts for slow inference

**Verification Steps:**
1. Check detection service for timing
2. Verify metrics collection

**Test Cases:**
- [ ] Inference time is measured
- [ ] Slow inference triggers alerts

---

#### 4.4 Memory Usage Tracking
- [ ] Memory usage monitored
- [ ] Memory leak detection
- [ ] Memory thresholds configured
- [ ] Alerts for high memory usage

**Verification Steps:**
1. Check for memory monitoring code
2. Verify TensorFlow.js memory tracking
3. Test for memory leaks

**Test Cases:**
- [ ] Memory usage is tracked
- [ ] Memory leaks are detected
- [ ] High memory triggers alerts

---

## ⚙️ PERFORMANCE & SCALABILITY

### 5. Load & Stress Handling

#### 5.1 Multi-Camera Support
- [ ] App handles 5+ cameras simultaneously
- [ ] Stream switching works smoothly
- [ ] Memory usage scales appropriately
- [ ] CPU usage remains acceptable
- [ ] Battery drain is reasonable

**Test Cases:**
- [ ] Add 5 cameras, all streams load
- [ ] Switch between cameras smoothly
- [ ] Memory usage < 500MB with 5 cameras
- [ ] CPU usage < 50% with 5 cameras
- [ ] Battery drain < 10%/hour with 5 cameras

---

#### 5.2 Long-Running Streams
- [ ] Streams run for 4+ hours without crash
- [ ] Memory stable over time
- [ ] Reconnection works after network loss
- [ ] Quality adapts to network conditions

**Test Cases:**
- [ ] Stream runs for 4 hours continuously
- [ ] Memory usage stable (no growth)
- [ ] Network loss triggers reconnection
- [ ] Quality adapts to bandwidth changes

---

#### 5.3 Background/Foreground Switching
- [ ] App handles 100+ background/foreground transitions
- [ ] Streams resume correctly after background
- [ ] No memory leaks from transitions
- [ ] Detection restarts properly

**Test Cases:**
- [ ] 100 background/foreground cycles, no crash
- [ ] Streams resume after background
- [ ] Memory stable after cycles
- [ ] Detection works after foreground

---

#### 5.4 Detection Throttling
- [ ] Detection throttles under load
- [ ] Frame rate adjusts dynamically
- [ ] CPU usage stays within limits
- [ ] Battery usage optimized

**Test Cases:**
- [ ] Detection throttles with 5 cameras
- [ ] Frame rate adjusts to maintain performance
- [ ] CPU usage stays < 60%
- [ ] Battery usage optimized

---

### 6. Battery & Resource Optimization

#### 6.1 Background Leak Prevention
- [ ] No wake locks held unnecessarily
- [ ] No background processing when app is backgrounded
- [ ] Streams stopped in background
- [ ] Detection stopped in background
- [ ] No background network requests

**Verification Steps:**
1. Check background handlers
2. Verify cleanup on background
3. Test battery usage

**Test Cases:**
- [ ] Battery drain < 2%/hour when backgrounded
- [ ] No wake locks when backgrounded
- [ ] No CPU usage when backgrounded

---

#### 6.2 Streaming Optimization
- [ ] Adaptive bitrate implemented
- [ ] Resolution adjusts to network
- [ ] Frame rate adjusts to performance
- [ ] CPU usage optimized

**Test Cases:**
- [ ] Bitrate adapts to network speed
- [ ] Resolution adjusts on slow networks
- [ ] Frame rate adjusts on slow devices
- [ ] CPU usage stays reasonable

---

#### 6.3 Detection Optimization
- [ ] Detection runs only when needed
- [ ] Detection throttles on battery saver
- [ ] Detection pauses in background
- [ ] Model unloaded when not in use

**Test Cases:**
- [ ] Detection stops when no cameras active
- [ ] Detection throttles on battery saver
- [ ] Detection pauses in background
- [ ] Model unloads when not needed

---

## 📦 CI/CD & RELEASE PREPARATION

### 7. Build Pipeline Hardening

#### 7.1 EAS Build Profiles
- [ ] Development profile validated
- [ ] Preview profile validated
- [ ] Production profile validated
- [ ] Build times acceptable
- [ ] Build sizes optimized

**Verification Steps:**
1. Check `apps/mobile/eas.json`
2. Test each build profile
3. Measure build times and sizes

**Test Cases:**
- [ ] Development build works
- [ ] Preview build works
- [ ] Production build works
- [ ] Build time < 30 minutes
- [ ] APK size < 100MB
- [ ] AAB size < 150MB

---

#### 7.2 Production Build Locking
- [ ] Production builds use production Supabase project
- [ ] Production builds use production API endpoints
- [ ] Production builds have no debug code
- [ ] Production builds have no test data
- [ ] Production builds have no dev tools

**Verification Steps:**
1. Check EAS production profile
2. Verify environment variables
3. Test production build

**Test Cases:**
- [ ] Production build connects to production DB
- [ ] Production build has no debug logs
- [ ] Production build has no dev menu

---

### 8. Rollback & Safety

#### 8.1 Feature Flags
- [ ] RTSP feature flag implemented
- [ ] Detection feature flag implemented
- [ ] Background task feature flag implemented
- [ ] Flags configurable remotely
- [ ] Flags cached locally

**Verification Steps:**
1. Check feature flag implementation
2. Verify remote configuration
3. Test flag changes

**Test Cases:**
- [ ] RTSP can be disabled remotely
- [ ] Detection can be disabled remotely
- [ ] Background tasks can be disabled remotely
- [ ] Flag changes take effect immediately

---

#### 8.2 Emergency Disable
- [ ] Emergency disable mechanism works
- [ ] App can be disabled without update
- [ ] Users notified of disable
- [ ] Graceful degradation implemented

**Test Cases:**
- [ ] Emergency disable stops all features
- [ ] Users see disable message
- [ ] App remains functional for basic features

---

## 📱 UX & STORE READINESS

### 9. User Experience Finalization

#### 9.1 Empty States
- [ ] Empty camera list shows helpful message
- [ ] Empty alert list shows helpful message
- [ ] Empty subscription state shows CTA
- [ ] All empty states have illustrations

**Test Cases:**
- [ ] Empty camera list shows "Add your first camera"
- [ ] Empty alert list shows "No alerts yet"
- [ ] Empty subscription shows "Upgrade now"

---

#### 9.2 Error States
- [ ] Network error shows helpful message
- [ ] Auth error shows helpful message
- [ ] Stream error shows helpful message
- [ ] All errors have retry option

**Test Cases:**
- [ ] Network error shows "Check your connection"
- [ ] Auth error shows "Please log in again"
- [ ] Stream error shows "Camera unavailable"

---

#### 9.3 Offline Messaging
- [ ] Offline banner shows consistently
- [ ] Offline features are clearly marked
- [ ] Users know what works offline
- [ ] Sync status is visible

**Test Cases:**
- [ ] Offline banner appears when offline
- [ ] Offline features have indicators
- [ ] Sync status shown when syncing

---

#### 9.4 Permission Education
- [ ] Camera permission explains need
- [ ] Notification permission explains need
- [ ] Biometric permission explains need
- [ ] All permissions have clear rationale

**Test Cases:**
- [ ] Camera permission shows "To monitor your security cameras"
- [ ] Notification permission shows "To receive security alerts"

---

### 10. Store Compliance

#### 10.1 Privacy Policy
- [ ] Privacy policy published
- [ ] Privacy policy linked in app
- [ ] Privacy policy covers all data collection
- [ ] Privacy policy covers all data usage

**Verification Steps:**
1. Review privacy policy
2. Check app links to policy
3. Verify policy completeness

**Test Cases:**
- [ ] Privacy policy accessible from settings
- [ ] Policy covers camera data
- [ ] Policy covers detection data
- [ ] Policy covers analytics data

---

#### 10.2 Data Usage Disclosures
- [ ] Camera usage disclosed
- [ ] Detection usage disclosed
- [ ] Network usage disclosed
- [ ] Battery usage disclosed

**Test Cases:**
- [ ] Store listing mentions camera usage
- [ ] Store listing mentions detection
- [ ] Store listing mentions network requirements

---

#### 10.3 Background Camera Justification
- [ ] Background camera use justified
- [ ] Background processing explained
- [ ] Battery impact disclosed
- [ ] User control documented

**Test Cases:**
- [ ] Store listing explains background monitoring
- [ ] Battery impact is disclosed
- [ ] Users can disable background monitoring

---

#### 10.4 Store Assets
- [ ] Screenshots prepared
- [ ] App icon optimized
- [ ] Feature graphic prepared
- [ ] Store description written
- [ ] Keywords optimized

**Verification Steps:**
1. Check store assets folder
2. Review screenshots
3. Review descriptions

**Test Cases:**
- [ ] At least 5 screenshots
- [ ] Screenshots show key features
- [ ] Description is compelling
- [ ] Keywords are relevant

---

## 📋 FINAL VERIFICATION

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console errors in production
- [ ] No console warnings in production
- [ ] All imports resolved

### Testing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Performance tested
- [ ] Security tested

### Documentation
- [ ] All code documented
- [ ] API documentation complete
- [ ] User documentation complete
- [ ] Deployment documentation complete

---

## 🚦 PRODUCTION READINESS GATES

### Critical (Must Pass)
- [ ] All secrets from EAS only
- [ ] No fallback keys or dev flags
- [ ] Certificate pinning implemented
- [ ] Token refresh validated
- [ ] Forced logout on refresh failure
- [ ] Sentry fully configured
- [ ] RTSP monitoring implemented
- [ ] ML monitoring implemented
- [ ] Performance metrics tracked
- [ ] Multi-camera load validated
- [ ] No memory leaks
- [ ] EAS profiles validated
- [ ] Production builds locked
- [ ] Feature flags implemented

### High (Should Pass)
- [ ] Empty/error states improved
- [ ] Offline messaging clear
- [ ] Permissions explained
- [ ] Privacy policy complete
- [ ] Store assets ready
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings resolved

### Medium (Nice to Have)
- [ ] Unit tests > 80% coverage
- [ ] Integration tests added
- [ ] E2E tests added
- [ ] Performance benchmarks documented

---

## ✅ SIGN-OFF

**Auditor**: _______________
**Date**: _______________
**Build Version**: _______________

**All Critical items passed**: [ ] Yes / [ ] No
**All High items passed**: [ ] Yes / [ ] No

**Approved for Production Release**: [ ] Yes / [ ] No

**Comments**: _______________________________________________

---

## 📝 NEXT STEPS

If all items pass:
1. Generate production readiness report
2. Create final deployment instructions
3. Schedule release
4. Deploy to production

If items fail:
1. Document failing items
2. Create remediation plan
3. Re-run checklist after fixes
4. Obtain sign-off before release

---

**Last Updated**: January 11, 2026
**Checklist Version**: 1.0
