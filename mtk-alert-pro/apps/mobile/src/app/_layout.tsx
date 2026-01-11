import { useEffect, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { AppState, AppStateStatus, Alert, Clipboard } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore, useAlertStore } from '@/stores';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import {
  logError,
  retryWithBackoff,
  isOnline
} from '@/lib/utils/cn';
import { adMobService } from '@/lib/ads/adMobService';
import { consentManager } from '@/lib/ads/consentManager';

// Conditionally import Sentry if available
let Sentry: any = null;
try {
  Sentry = require('@sentry/react-native');
} catch (error) {
  console.warn('[Sentry] Not installed - error tracking disabled');
}

// Error Boundary Component to catch crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);

    // Log to Sentry if configured
    if (Sentry && Sentry.getCurrentHub && Sentry.getCurrentHub().getClient()) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: 'root',
        },
      });
    }

    // Log to custom error handler
    logError(error, 'ErrorBoundary.root');
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReportIssue = () => {
    if (this.state.error) {
      const errorDetails = `
Error: ${this.state.error.message}
Stack: ${this.state.error.stack}
Time: ${new Date().toISOString()}
      `.trim();

      Clipboard.setString(errorDetails);
      Alert.alert(
        'Error Copied',
        'Error details have been copied to clipboard. Please send to support.',
        [{ text: 'OK' }]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <View style={errorStyles.buttonContainer}>
            <TouchableOpacity style={errorStyles.button} onPress={this.handleRestart}>
              <Text style={errorStyles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[errorStyles.button, errorStyles.secondaryButton]}
              onPress={this.handleReportIssue}
            >
              <Text style={errorStyles.buttonText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    backgroundColor: colors.brand.red,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  secondaryButton: {
    backgroundColor: colors.bg.secondary,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const subscribeToAlerts = useAlertStore((state) => state.subscribeToAlerts);
  const [appReady, setAppReady] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const init = async () => {
      try {
        // Create a safety timeout promise
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('App initialization timed out - forcing load');
            resolve();
          }, 7000); // 7 seconds max wait time
        });

        // The actual initialization logic
        const initPromise = (async () => {
          // Initialize auth and wait for completion
          await initialize();

          // Initialize AdMob and Consent Manager parallel to save time
          try {
            // Don't await these strictly if they take too long
            await Promise.race([
              (async () => {
                await consentManager.requestConsent();
                await adMobService.initialize();
                console.log('[AdMob] Injected into app lifecycle');
              })(),
              new Promise((resolve) => setTimeout(resolve, 3000)) // Give ads max 3s
            ]);
          } catch (adError) {
            console.error('[AdMob] Init failed:', adError);
          }
        })();

        // Race the initialization against the safety timeout
        await Promise.race([initPromise, timeoutPromise]);

      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        // Small delay to ensure state is settled
        await new Promise(resolve => setTimeout(resolve, 100));
        setAppReady(true);
        // Hide splash screen only when truly ready
        await SplashScreen.hideAsync().catch(err => console.warn('Splash hide error:', err));
      }
    };
    init();
  }, [initialize]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[AppState] Changed from', appState, 'to', nextAppState);

      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('[AppState] App came to foreground');
        handleForeground();
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background
        console.log('[AppState] App going to background');
        handleBackground();
      }

      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Handle foreground transition
  const handleForeground = async () => {
    try {
      console.log('[AppState] Refreshing data on foreground');

      // Refresh user session
      await initialize();

      // Re-subscribe to alerts if authenticated
      if (isAuthenticated) {
        subscribeToAlerts();
      }

      // Refresh camera data
      const { useCameraStore } = await import('@/stores/cameraStore');
      useCameraStore.getState().fetchCameras();

    } catch (error) {
      console.error('[AppState] Foreground handler error:', error);
    }
  };

  // Handle background transition
  const handleBackground = async () => {
    try {
      console.log('[AppState] Cleaning up on background');

      // Stop all camera streams
      const { streamingService } = await import('@/lib/streaming/streamingService');
      // Note: streamingService may not have unregisterAllCameras, use individual unregister
      const cameras = await import('@/stores/cameraStore').then(m => m.useCameraStore.getState().cameras);
      cameras.forEach(camera => {
        streamingService.unregisterCamera(camera.id);
      });

      // Stop detection
      const { detectionManager } = await import('@/features/detection/detectionManager');
      detectionManager.stopAll();

      console.log('[AppState] Background cleanup complete');
    } catch (error) {
      console.error('[AppState] Background handler error:', error);
    }
  };

  // Subscribe to real-time alerts when authenticated
  useEffect(() => {
    if (isAuthenticated && appReady) {
      const unsubscribe = subscribeToAlerts();
      return () => {
        unsubscribe();
      };
    }
  }, [isAuthenticated, appReady, subscribeToAlerts]);

  // Show loading screen ONLY during initial app load
  // Do NOT depend on isLoading from auth store - that causes blinking
  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand.red} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0F172A' },
              animation: 'slide_from_right',
            }}
          />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
