/**
 * Subscription Store
 * 
 * Manages subscription state, plan limits, and payment handling
 * with proper backend synchronization
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorHandler';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
}

export interface PlanLimits {
  maxCameras: number;
  maxAlertHistory: number; // days
  maxCloudStorage: number; // GB
  hasAIDetection: boolean;
  hasFaceRecognition: boolean;
  hasCustomZones: boolean;
  hasPrioritySupport: boolean;
  hasAPIAccess: boolean;
  streamQuality: 'sd' | 'hd' | '4k';
}

export interface SubscriptionState {
  // Current subscription info
  currentTier: SubscriptionTier;
  expiresAt: Date | null;
  isActive: boolean;
  
  // Plan details
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  
  // Usage tracking
  usage: {
    camerasUsed: number;
    storageUsedGB: number;
    alertsThisMonth: number;
  };
  
  // Loading states
  isLoading: boolean;
  isUpgrading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkFeatureAccess: (feature: keyof PlanLimits) => boolean;
  canAddCamera: () => boolean;
  getRemainingCameras: () => number;
  getUpgradeUrl: (planId: SubscriptionTier) => string;
  requestUpgrade: (planId: SubscriptionTier) => Promise<{ success: boolean; message: string }>;
  updateUsage: (usage: Partial<SubscriptionState['usage']>) => void;
  clearError: () => void;
}

// ============================================================================
// Plan Definitions
// ============================================================================

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'PKR',
    period: 'monthly',
    features: [
      '2 Cameras Maximum',
      'Person & Vehicle Detection',
      '7-Day Alert History',
      'Email Notifications',
      'Standard Quality Streams',
      'Basic Support',
    ],
    limits: {
      maxCameras: 2,
      maxAlertHistory: 7,
      maxCloudStorage: 1,
      hasAIDetection: true,
      hasFaceRecognition: false,
      hasCustomZones: false,
      hasPrioritySupport: false,
      hasAPIAccess: false,
      streamQuality: 'sd',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    currency: 'PKR',
    period: 'monthly',
    popular: true,
    features: [
      'Unlimited Cameras',
      'AI Face Recognition',
      'Person & Vehicle Detection',
      '30-Day Alert History',
      'Push + Email Notifications',
      'HD/4K Stream Quality',
      '100GB Cloud Storage',
      'Priority Support',
      'Red Alert Mode',
      'Custom Detection Zones',
    ],
    limits: {
      maxCameras: Infinity,
      maxAlertHistory: 30,
      maxCloudStorage: 100,
      hasAIDetection: true,
      hasFaceRecognition: true,
      hasCustomZones: true,
      hasPrioritySupport: true,
      hasAPIAccess: false,
      streamQuality: 'hd',
    },
  },
  {
    id: 'business',
    name: 'Business',
    price: 1500,
    currency: 'PKR',
    period: 'monthly',
    features: [
      'Unlimited Cameras',
      'Advanced AI Analytics',
      'Face Recognition Database',
      'People Counting',
      'Unlimited Alert History',
      'Multi-User Management',
      'Unlimited Cloud Storage',
      'API Access',
      '24/7 Premium Support',
      'Custom Integrations',
      'SLA Guaranteed Uptime',
    ],
    limits: {
      maxCameras: Infinity,
      maxAlertHistory: Infinity,
      maxCloudStorage: Infinity,
      hasAIDetection: true,
      hasFaceRecognition: true,
      hasCustomZones: true,
      hasPrioritySupport: true,
      hasAPIAccess: true,
      streamQuality: '4k',
    },
  },
];

// ============================================================================
// Store Implementation
// ============================================================================

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTier: 'free',
      expiresAt: null,
      isActive: true,
      plans: SUBSCRIPTION_PLANS,
      currentPlan: SUBSCRIPTION_PLANS[0],
      usage: {
        camerasUsed: 0,
        storageUsedGB: 0,
        alertsThisMonth: 0,
      },
      isLoading: false,
      isUpgrading: false,
      error: null,

      // Initialize subscription from backend
      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            set({ isLoading: false });
            return;
          }

          // Fetch subscription from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_expires_at')
            .eq('id', user.id)
            .single();

          if (profileError) {
            throw profileError;
          }

          const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
          const expiresAt = profile?.subscription_expires_at 
            ? new Date(profile.subscription_expires_at) 
            : null;
          
          // Check if subscription is still active
          const isActive = !expiresAt || expiresAt > new Date();
          const effectiveTier = isActive ? tier : 'free';

          const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === effectiveTier) || SUBSCRIPTION_PLANS[0];

          // Fetch usage stats
          const { count: cameraCount } = await supabase
            .from('cameras')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          set({
            currentTier: effectiveTier,
            expiresAt,
            isActive,
            currentPlan,
            usage: {
              ...get().usage,
              camerasUsed: cameraCount || 0,
            },
            isLoading: false,
          });
        } catch (error: any) {
          logError(error, 'SubscriptionStore.initialize');
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to load subscription' 
          });
        }
      },

      // Refresh subscription status
      refreshSubscription: async () => {
        await get().initialize();
      },

      // Check if user has access to a feature
      checkFeatureAccess: (feature: keyof PlanLimits) => {
        const { currentPlan } = get();
        if (!currentPlan) return false;
        
        const value = currentPlan.limits[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        return true;
      },

      // Check if user can add another camera
      canAddCamera: () => {
        const { currentPlan, usage } = get();
        if (!currentPlan) return false;
        
        return usage.camerasUsed < currentPlan.limits.maxCameras;
      },

      // Get remaining camera slots
      getRemainingCameras: () => {
        const { currentPlan, usage } = get();
        if (!currentPlan) return 0;
        
        if (currentPlan.limits.maxCameras === Infinity) return Infinity;
        return Math.max(0, currentPlan.limits.maxCameras - usage.camerasUsed);
      },

      // Get WhatsApp upgrade URL
      getUpgradeUrl: (planId: SubscriptionTier) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) return '';
        
        const WHATSAPP_NUMBER = '923038111297';
        const message = encodeURIComponent(
          `Hi, I want to upgrade to MTK AlertPro ${plan.name} plan (Rs. ${plan.price}/month). Please guide me.`
        );
        
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      },

      // Request upgrade (opens WhatsApp or payment flow)
      requestUpgrade: async (planId: SubscriptionTier) => {
        set({ isUpgrading: true, error: null });
        
        try {
          const { currentTier } = get();
          
          if (planId === currentTier) {
            return { success: false, message: 'You are already on this plan' };
          }

          if (planId === 'free') {
            // Downgrade logic - update in Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('profiles')
                .update({ 
                  subscription_tier: 'free',
                  subscription_expires_at: null,
                })
                .eq('id', user.id);
              
              await get().initialize();
            }
            return { success: true, message: 'Downgraded to Free plan' };
          }

          // For paid plans, return WhatsApp URL
          const url = get().getUpgradeUrl(planId);
          
          set({ isUpgrading: false });
          return { 
            success: true, 
            message: 'Opening WhatsApp for upgrade',
            url,
          } as any;
        } catch (error: any) {
          logError(error, 'SubscriptionStore.requestUpgrade');
          set({ 
            isUpgrading: false, 
            error: error.message || 'Upgrade request failed' 
          });
          return { success: false, message: error.message };
        }
      },

      // Update usage stats
      updateUsage: (usage) => {
        set((state) => ({
          usage: { ...state.usage, ...usage },
        }));
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentTier: state.currentTier,
        expiresAt: state.expiresAt,
        usage: state.usage,
      }),
    }
  )
);

// ============================================================================
// Helper Hooks
// ============================================================================

export const useIsPremium = () => {
  const tier = useSubscriptionStore((state) => state.currentTier);
  return tier === 'pro' || tier === 'business';
};

export const usePlanLimits = () => {
  const currentPlan = useSubscriptionStore((state) => state.currentPlan);
  return currentPlan?.limits || SUBSCRIPTION_PLANS[0].limits;
};

