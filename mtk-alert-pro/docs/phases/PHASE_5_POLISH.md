# Phase 5: Polish & Testing (Week 10-11)

## Goals
- ✅ UI/UX refinement
- ✅ Performance optimization
- ✅ Unit testing setup
- ✅ E2E testing with Maestro
- ✅ Error tracking (Sentry)
- ✅ Analytics (PostHog)
- ✅ Security audit

---

## Step 1: Install Testing & Monitoring Dependencies

```bash
cd apps/mobile

# Testing
pnpm add -D jest @testing-library/react-native jest-expo
pnpm add -D @types/jest ts-jest

# Error tracking
pnpm add @sentry/react-native

# Analytics
pnpm add posthog-react-native

# Performance monitoring
pnpm add react-native-performance

# Rebuild
npx expo prebuild --clean
```

---

## Step 2: Jest Configuration

### `apps/mobile/jest.config.js`
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

### `apps/mobile/jest.setup.js`
```javascript
import '@testing-library/react-native/extend-expect';

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence console warnings in tests
global.console.warn = jest.fn();
```

---

## Step 3: Unit Tests

### `src/stores/__tests__/authStore.test.ts`
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => ({ data: { session: null } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set loading state during sign in', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Start sign in
    const signInPromise = act(async () => {
      await result.current.signInWithEmail('test@test.com', 'password123');
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    await signInPromise;
  });

  it('should sign out correctly', async () => {
    const { result } = renderHook(() => useAuthStore());

    // Set authenticated state
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com' } as any,
      isAuthenticated: true,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### `src/components/ui/__tests__/Button.test.tsx`
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Press</Button>);

    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        Disabled
      </Button>
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(<Button loading>Loading</Button>);
    // ActivityIndicator has testID by default
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });
});
```

### `src/lib/mlkit/__tests__/detector.test.ts`
```typescript
import { mlkitDetector } from '../detector';

// Mock ML Kit modules
jest.mock('@react-native-ml-kit/face-detection', () => ({
  FaceDetector: jest.fn().mockImplementation(() => ({
    process: jest.fn(() => []),
  })),
}));

jest.mock('@react-native-ml-kit/image-labeling', () => ({
  ImageLabeler: jest.fn().mockImplementation(() => ({
    process: jest.fn(() => [
      { text: 'Person', confidence: 0.9 },
      { text: 'Indoor', confidence: 0.8 },
    ]),
  })),
}));

describe('MLKit Detector', () => {
  beforeEach(async () => {
    await mlkitDetector.initialize();
  });

  afterEach(() => {
    mlkitDetector.cleanup();
  });

  it('should initialize without errors', async () => {
    await expect(mlkitDetector.initialize()).resolves.not.toThrow();
  });

  it('should detect person in image', async () => {
    const results = await mlkitDetector.detectObjects('test-image-uri');

    const personDetection = results.find((r) => r.type === 'person');
    expect(personDetection).toBeDefined();
    expect(personDetection?.confidence).toBeGreaterThan(0.8);
  });

  it('should respect detection options', async () => {
    const results = await mlkitDetector.detect('test-uri', {
      detectPerson: true,
      detectVehicle: false,
      detectFace: false,
    });

    const vehicleDetection = results.find((r) => r.type === 'vehicle');
    expect(vehicleDetection).toBeUndefined();
  });
});
```

---

## Step 4: E2E Tests with Maestro

### `apps/mobile/e2e/auth.yaml`
```yaml
appId: com.mtk.alertpro
---
# Authentication Flow Test
- launchApp

# Test Login Screen
- assertVisible: "MTK AlertPro"
- assertVisible: "Sign In"

# Enter credentials
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "TestPassword123"

# Submit
- tapOn: "Sign In"

# Wait for dashboard
- assertVisible:
    text: "Welcome back"
    timeout: 10000

# Verify navigation tabs
- assertVisible: "Home"
- assertVisible: "Cameras"
- assertVisible: "Alerts"
- assertVisible: "Settings"
```

### `apps/mobile/e2e/camera-flow.yaml`
```yaml
appId: com.mtk.alertpro
---
# Camera Management Flow
- launchApp:
    clearState: true

# Login first
- runFlow: auth.yaml

# Navigate to Cameras
- tapOn: "Cameras"

# Add new camera
- tapOn: "Add"

# Fill camera form
- tapOn: "Camera Name"
- inputText: "Front Door"

- tapOn: "RTSP URL"
- inputText: "rtsp://192.168.1.100:554/stream"

# Submit
- tapOn: "Add Camera"

# Verify camera added
- assertVisible:
    text: "Front Door"
    timeout: 5000

# Delete camera
- longPressOn: "Front Door"
- tapOn: "Delete"
- tapOn: "Confirm"

# Verify deleted
- assertNotVisible: "Front Door"
```

### `apps/mobile/e2e/alerts.yaml`
```yaml
appId: com.mtk.alertpro
---
# Alerts Flow Test
- launchApp
- runFlow: auth.yaml

# Navigate to Alerts
- tapOn: "Alerts"

# Verify alerts screen
- assertVisible: "Alerts"

# Test mark all as read (if alerts exist)
- tapOn:
    text: "Mark all read"
    optional: true

# Test Red Alert Toggle
- tapOn: "Home"
- tapOn: "Red Alert Mode"

# Verify toggle activated
- assertVisible: "Maximum sensitivity active"

# Disable Red Alert
- tapOn: "Red Alert Mode"
- assertVisible: "Tap to enable max sensitivity"
```

---

## Step 5: Sentry Error Tracking

### `src/lib/monitoring/sentry.ts`
```typescript
import * as Sentry from '@sentry/react-native';

export function initializeSentry() {
  if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
    console.log('Sentry disabled in development');
    return;
  }

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_APP_ENV,
    debug: false,
    
    // Performance monitoring
    tracesSampleRate: 0.2,
    
    // Session replay (optional)
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    
    // Filtering
    beforeSend(event) {
      // Don't send events with sensitive data
      if (event.request?.data) {
        delete event.request.data;
      }
      return event;
    },
    
    // Ignore common non-errors
    ignoreErrors: [
      'Network request failed',
      'ResizeObserver loop limit exceeded',
    ],
  });
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function setUserContext(userId: string, email: string) {
  Sentry.setUser({ id: userId, email });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
  });
}
```

---

## Step 6: PostHog Analytics

### `src/lib/monitoring/analytics.ts`
```typescript
import PostHog from 'posthog-react-native';

let posthog: PostHog | null = null;

export async function initializeAnalytics() {
  if (process.env.EXPO_PUBLIC_APP_ENV === 'development') {
    console.log('Analytics disabled in development');
    return;
  }

  posthog = await PostHog.initAsync(
    process.env.EXPO_PUBLIC_POSTHOG_KEY!,
    {
      host: 'https://app.posthog.com',
      captureApplicationLifecycleEvents: true,
      captureDeepLinks: true,
    }
  );
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog?.identify(userId, properties);
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog?.capture(event, properties);
}

export function trackScreen(screenName: string) {
  posthog?.screen(screenName);
}

export function resetAnalytics() {
  posthog?.reset();
}

// Predefined events
export const AnalyticsEvents = {
  // Auth
  SIGN_UP: 'user_signed_up',
  SIGN_IN: 'user_signed_in',
  SIGN_OUT: 'user_signed_out',
  
  // Camera
  CAMERA_ADDED: 'camera_added',
  CAMERA_DELETED: 'camera_deleted',
  STREAM_STARTED: 'stream_started',
  STREAM_ERROR: 'stream_error',
  
  // Detection
  DETECTION_ENABLED: 'detection_enabled',
  ALERT_RECEIVED: 'alert_received',
  ALERT_VIEWED: 'alert_viewed',
  RED_ALERT_TOGGLED: 'red_alert_toggled',
  
  // Recording
  RECORDING_STARTED: 'recording_started',
  RECORDING_SAVED: 'recording_saved',
  
  // Subscription
  PRO_TRIAL_STARTED: 'pro_trial_started',
  SUBSCRIPTION_PURCHASED: 'subscription_purchased',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
} as const;
```

---

## Step 7: Performance Optimization

### `src/lib/performance/optimizations.ts`
```typescript
import { useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Defer heavy operations until after animations complete
 */
export function runAfterInteractions<T>(task: () => T): Promise<T> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve(task());
    });
  });
}

/**
 * Debounce function for search/input handlers
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = { current: null as NodeJS.Timeout | null };

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Throttle function for scroll handlers
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): T {
  const inThrottle = { current: false };

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [callback, limit]
  );
}

/**
 * Image optimization settings
 */
export const ImageConfig = {
  thumbnailSize: { width: 300, height: 200 },
  snapshotSize: { width: 640, height: 480 },
  compressionQuality: 0.7,
};

/**
 * List optimization settings
 */
export const ListConfig = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 5,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
};
```

### `src/components/common/OptimizedList.tsx`
```typescript
import { memo, useCallback } from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { ListConfig } from '@/lib/performance/optimizations';

interface OptimizedListProps<T> extends FlatListProps<T> {}

function OptimizedListComponent<T>({
  ...props
}: OptimizedListProps<T>) {
  const keyExtractor = useCallback(
    (item: any, index: number) =>
      props.keyExtractor?.(item, index) || item.id || String(index),
    [props.keyExtractor]
  );

  return (
    <FlatList
      {...props}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      initialNumToRender={ListConfig.initialNumToRender}
      maxToRenderPerBatch={ListConfig.maxToRenderPerBatch}
      windowSize={ListConfig.windowSize}
      updateCellsBatchingPeriod={ListConfig.updateCellsBatchingPeriod}
      getItemLayout={
        props.getItemLayout ||
        ((_, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        }))
      }
    />
  );
}

export const OptimizedList = memo(OptimizedListComponent) as typeof OptimizedListComponent;
```

---

## Step 8: Security Checklist

### `docs/SECURITY_AUDIT.md`
```markdown
# Security Audit Checklist

## Authentication
- [x] Passwords hashed (Supabase handles)
- [x] JWT tokens stored in SecureStore
- [x] Token refresh implemented
- [x] Logout clears all sensitive data

## Data Protection
- [x] RTSP credentials encrypted at rest
- [x] Row Level Security enabled on all tables
- [x] No sensitive data in logs
- [x] API keys in environment variables

## Network
- [x] HTTPS enforced for all API calls
- [x] Certificate pinning (optional)
- [x] No hardcoded secrets in codebase

## Storage
- [x] Local recordings auto-deleted after 48h
- [x] Cloud storage scoped to user
- [x] Snapshots have expiring URLs

## Permissions
- [x] Minimal Android permissions requested
- [x] Camera permission only for QR scanning
- [x] Notification permission requested at runtime

## Code
- [x] No eval() or dynamic code execution
- [x] Input validation with Zod
- [x] SQL injection prevented (Supabase)
- [x] XSS prevented (React Native)

## Third Party
- [x] Dependencies audited (npm audit)
- [x] No deprecated packages
- [x] GDPR compliant analytics
```

---

## Step 9: Performance Targets Verification

```bash
# Run performance tests
pnpm test:perf

# Check APK size
cd android && ./gradlew assembleRelease
ls -lh app/build/outputs/apk/release/app-release.apk

# Profile startup time
adb shell am start -W com.mtk.alertpro/.MainActivity

# Memory profiling
adb shell dumpsys meminfo com.mtk.alertpro
```

### Performance Checklist
| Metric | Target | Status |
|--------|--------|--------|
| APK Size | < 50MB | ⬜ |
| Cold Start | < 3s | ⬜ |
| Memory (Idle) | < 100MB | ⬜ |
| Memory (Streaming) | < 200MB | ⬜ |
| Detection Latency | < 500ms | ⬜ |
| Frame Rate | 60 FPS | ⬜ |

---

## Deliverables Checklist

- [ ] Jest unit tests (60%+ coverage)
- [ ] Maestro E2E tests for critical flows
- [ ] Sentry error tracking integrated
- [ ] PostHog analytics integrated
- [ ] Performance optimizations applied
- [ ] Security audit completed
- [ ] APK size optimized (< 50MB)
- [ ] Memory leaks fixed
- [ ] Crash-free rate > 99%

---

## Next Phase

➡️ [Phase 6: Launch](./PHASE_6_LAUNCH.md)
