# Phase 1: Foundation (Week 1-2)

## Goals
- ✅ File-based routing with Expo Router
- ✅ Supabase authentication (Email + Google)
- ✅ Zustand state management
- ✅ Core UI components
- ✅ Onboarding flow

---

## Step 1: Project Structure

```bash
# Create source directories
cd apps/mobile
mkdir -p src/{app,components,features,lib,stores,hooks,types}
mkdir -p src/app/{"(auth)","(tabs)"}
mkdir -p src/components/{ui,layouts}
mkdir -p src/features/{auth,cameras,alerts,settings}
mkdir -p src/lib/{supabase,utils}
```

---

## Step 2: Supabase Client Setup

### `src/lib/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@mtk/shared';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Secure storage adapter for auth tokens
const secureStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fallback for web/testing
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## Step 3: TypeScript Types

### `src/types/index.ts`
```typescript
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionTier: 'free' | 'pro' | 'business';
  subscriptionExpiresAt: Date | null;
}

export interface Camera {
  id: string;
  userId: string;
  name: string;
  rtspUrl: string;
  username?: string;
  password?: string;
  isActive: boolean;
  thumbnailUrl?: string;
  detectionSettings: DetectionSettings;
  createdAt: Date;
}

export interface DetectionSettings {
  person: boolean;
  vehicle: boolean;
  face?: boolean;
  sensitivity: number; // 0.0 - 1.0
  zones?: DetectionZone[];
}

export interface DetectionZone {
  id: string;
  name: string;
  polygon: { x: number; y: number }[];
  isActive: boolean;
}

export interface Alert {
  id: string;
  cameraId: string;
  userId: string;
  type: 'person' | 'vehicle' | 'face' | 'motion';
  confidence: number;
  snapshotUrl?: string;
  videoClipUrl?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export interface AppSettings {
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  detection: {
    redAlertMode: boolean;
    cooldownSeconds: number;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    streamQuality: '720p' | '1080p';
  };
}
```

---

## Step 4: Auth Store (Zustand)

### `src/stores/authStore.ts`
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({
                user: {
                  id: profile.id,
                  email: profile.email,
                  displayName: profile.display_name,
                  avatarUrl: profile.avatar_url,
                  subscriptionTier: profile.subscription_tier as 'free' | 'pro' | 'business',
                  subscriptionExpiresAt: profile.subscription_expires_at 
                    ? new Date(profile.subscription_expires_at) 
                    : null,
                },
                isAuthenticated: true,
              });
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithEmail: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          await get().initialize();
        } finally {
          set({ isLoading: false });
        }
      },

      signUpWithEmail: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;
          // Profile is auto-created via database trigger
          await get().initialize();
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithGoogle: async () => {
        // Google OAuth implementation
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'mtkalertpro://auth/callback',
          },
        });

        if (error) throw error;
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: async (updates) => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: updates.displayName,
            avatar_url: updates.avatarUrl,
          })
          .eq('id', user.id);

        if (error) throw error;
        set({ user: { ...user, ...updates } });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

---

## Step 5: UI Components

### `src/components/ui/Button.tsx`
```typescript
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-xl',
  {
    variants: {
      variant: {
        primary: 'bg-brand-blue active:bg-brand-blue/90',
        secondary: 'bg-gray-200 dark:bg-gray-700 active:bg-gray-300',
        destructive: 'bg-brand-red active:bg-brand-red/90',
        outline: 'border-2 border-brand-blue bg-transparent',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'h-10 px-4',
        md: 'h-12 px-6',
        lg: 'h-14 px-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const textVariants = cva('font-semibold', {
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-gray-900 dark:text-white',
      destructive: 'text-white',
      outline: 'text-brand-blue',
      ghost: 'text-brand-blue',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  variant,
  size,
  onPress,
  disabled,
  loading,
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size }),
        disabled && 'opacity-50',
        className
      )}
    >
      {loading && <ActivityIndicator color="white" className="mr-2" />}
      <Text className={textVariants({ variant, size })}>{children}</Text>
    </Pressable>
  );
}
```

### `src/components/ui/Input.tsx`
```typescript
import { TextInput, View, Text } from 'react-native';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'h-12 rounded-xl border-2 bg-white px-4 text-base text-gray-900',
            'dark:bg-gray-800 dark:text-white',
            error ? 'border-brand-red' : 'border-gray-200 dark:border-gray-600',
            'focus:border-brand-blue',
            className
          )}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-brand-red">{error}</Text>
        )}
      </View>
    );
  }
);
```

### `src/lib/utils/cn.ts`
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 6: App Layout & Navigation

### `src/app/_layout.tsx`
```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
```

### `src/app/(auth)/_layout.tsx`
```typescript
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-navy">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
```

### `src/app/(auth)/login.tsx`
```typescript
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signInWithEmail, signInWithGoogle, isLoading } = useAuthStore();
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await signInWithEmail(data.email, data.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      // Handle error (show toast)
      console.error(error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-navy">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        {/* Logo */}
        <View className="mb-8 items-center">
          <Text className="text-4xl font-bold text-white">🚨</Text>
          <Text className="mt-2 text-2xl font-bold text-white">MTK AlertPro</Text>
          <Text className="mt-1 text-gray-400">Smart Alerts, Safer Homes</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            className="mt-4"
          >
            Sign In
          </Button>

          <Button
            variant="outline"
            onPress={signInWithGoogle}
          >
            Continue with Google
          </Button>
        </View>

        {/* Footer */}
        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-400">Don't have an account? </Text>
          <Link href="/(auth)/register">
            <Text className="font-semibold text-brand-blue">Sign Up</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

## Step 7: Main Tab Navigator

### `src/app/(tabs)/_layout.tsx`
```typescript
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ActivityIndicator, View } from 'react-native';
import { Home, Camera, Bell, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-navy">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cameras"
        options={{
          title: 'Cameras',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## Deliverables Checklist

- [ ] Supabase client configured with secure storage
- [ ] Zustand auth store with persist middleware
- [ ] Email authentication flow (login/register)
- [ ] Google OAuth integration
- [ ] Reusable UI components (Button, Input)
- [ ] Expo Router file-based navigation
- [ ] Auth-protected tab navigation
- [ ] Loading states and error handling
- [ ] TypeScript types for all entities

---

## Next Phase

➡️ [Phase 2: Camera Integration](./PHASE_2_CAMERAS.md)
