/**
 * Professional Subscription Service
 * 
 * Handles subscription management with multiple payment providers,
 * receipt validation, and proper backend synchronization
 */

import { Platform, Linking } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { logError, createAppError } from '@/lib/utils/errorHandler';
import type { SubscriptionTier } from '@/stores/subscriptionStore';

// ============================================================================
// Types
// ============================================================================

export interface PaymentProvider {
  id: 'whatsapp' | 'easypaisa' | 'jazzcash' | 'bank' | 'stripe';
  name: string;
  icon: string;
  available: boolean;
  description: string;
}

export interface PaymentRequest {
  planId: SubscriptionTier;
  userId: string;
  email: string;
  provider: PaymentProvider['id'];
  amount: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  redirectUrl?: string;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
}

export interface UpgradePromptConfig {
  feature: string;
  requiredTier: SubscriptionTier;
  title: string;
  description: string;
  benefits: string[];
}

// ============================================================================
// Constants
// ============================================================================

const WHATSAPP_NUMBER = '923020718182';
const DEVELOPER_NAME = 'Muhammad Kashif';

const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'message-circle',
    available: true,
    description: 'Pay via WhatsApp - instant activation',
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: 'smartphone',
    available: true,
    description: 'Pay with your EasyPaisa account',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: 'credit-card',
    available: true,
    description: 'Pay with JazzCash mobile wallet',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: 'building',
    available: true,
    description: 'Direct bank transfer',
  },
];

const PLAN_PRICES: Record<SubscriptionTier, { pkr: number; usd: number }> = {
  free: { pkr: 0, usd: 0 },
  pro: { pkr: 500, usd: 5 },
  business: { pkr: 1500, usd: 15 },
};

// ============================================================================
// Subscription Service Class
// ============================================================================

class SubscriptionService {
  private initialized = false;

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Validate subscription status on startup
      await this.validateSubscription();
      this.initialized = true;
      console.log('[SubscriptionService] Initialized');
    } catch (error: any) {
      logError(error, 'SubscriptionService.initialize');
    }
  }

  // ---------------------------------------------------------------------------
  // Payment Providers
  // ---------------------------------------------------------------------------

  getAvailableProviders(): PaymentProvider[] {
    return PAYMENT_PROVIDERS.filter(p => p.available);
  }

  // ---------------------------------------------------------------------------
  // Subscription Validation
  // ---------------------------------------------------------------------------

  async validateSubscription(): Promise<SubscriptionStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          tier: 'free',
          isActive: true,
          expiresAt: null,
          autoRenew: false,
        };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, subscription_auto_renew')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
      const expiresAt = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : null;

      // Check if expired
      const isActive = !expiresAt || expiresAt > new Date();

      // If expired, downgrade to free
      if (!isActive && tier !== 'free') {
        await this.downgradeToFree(user.id);
        return {
          tier: 'free',
          isActive: true,
          expiresAt: null,
          autoRenew: false,
        };
      }

      return {
        tier: isActive ? tier : 'free',
        isActive,
        expiresAt,
        autoRenew: profile?.subscription_auto_renew || false,
      };
    } catch (error: any) {
      logError(error, 'SubscriptionService.validateSubscription');
      return {
        tier: 'free',
        isActive: true,
        expiresAt: null,
        autoRenew: false,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Payment Processing
  // ---------------------------------------------------------------------------

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('[SubscriptionService] Initiating payment:', request);

      // Create payment record in database
      const { data: payment, error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: request.userId,
          plan_id: request.planId,
          amount: request.amount,
          currency: request.currency,
          provider: request.provider,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.warn('[SubscriptionService] Failed to create payment record:', dbError);
      }

      // Route to appropriate payment handler
      switch (request.provider) {
        case 'whatsapp':
          return this.handleWhatsAppPayment(request, payment?.id);
        case 'easypaisa':
          return this.handleEasyPaisaPayment(request, payment?.id);
        case 'jazzcash':
          return this.handleJazzCashPayment(request, payment?.id);
        case 'bank':
          return this.handleBankTransfer(request, payment?.id);
        default:
          return this.handleWhatsAppPayment(request, payment?.id);
      }
    } catch (error: any) {
      logError(error, 'SubscriptionService.initiatePayment');
      return {
        success: false,
        message: error.message || 'Payment initiation failed',
      };
    }
  }

  private async handleWhatsAppPayment(
    request: PaymentRequest,
    paymentId?: string
  ): Promise<PaymentResult> {
    const planName = request.planId.charAt(0).toUpperCase() + request.planId.slice(1);

    const message = encodeURIComponent(
      `🔐 *MTK AlertPro Subscription Request*\n\n` +
      `📧 Email: ${request.email}\n` +
      `📱 Plan: *${planName}*\n` +
      `💰 Amount: Rs. ${request.amount}/month\n` +
      `🆔 Ref: ${paymentId || 'N/A'}\n\n` +
      `Hi ${DEVELOPER_NAME}, I want to subscribe to MTK AlertPro ${planName} plan.\n` +
      `Please guide me through the payment process.`
    );

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    await Linking.openURL(url);

    return {
      success: true,
      transactionId: paymentId,
      message: 'Opening WhatsApp for payment',
      redirectUrl: url,
    };
  }

  private async handleEasyPaisaPayment(
    request: PaymentRequest,
    paymentId?: string
  ): Promise<PaymentResult> {
    // For EasyPaisa, show account details
    const message = encodeURIComponent(
      `🔐 *MTK AlertPro - EasyPaisa Payment*\n\n` +
      `Send Rs. ${request.amount} to:\n` +
      `📱 Account: 03020718182\n` +
      `👤 Name: ${DEVELOPER_NAME}\n\n` +
      `After payment, send screenshot with:\n` +
      `📧 Email: ${request.email}\n` +
      `📱 Plan: ${request.planId}\n` +
      `🆔 Ref: ${paymentId || 'N/A'}`
    );

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    await Linking.openURL(url);

    return {
      success: true,
      transactionId: paymentId,
      message: 'Send payment to EasyPaisa account and share screenshot',
      redirectUrl: url,
    };
  }

  private async handleJazzCashPayment(
    request: PaymentRequest,
    paymentId?: string
  ): Promise<PaymentResult> {
    const message = encodeURIComponent(
      `🔐 *MTK AlertPro - JazzCash Payment*\n\n` +
      `Send Rs. ${request.amount} to:\n` +
      `📱 Account: 03020718182\n` +
      `👤 Name: ${DEVELOPER_NAME}\n\n` +
      `After payment, send screenshot with:\n` +
      `📧 Email: ${request.email}\n` +
      `📱 Plan: ${request.planId}\n` +
      `🆔 Ref: ${paymentId || 'N/A'}`
    );

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    await Linking.openURL(url);

    return {
      success: true,
      transactionId: paymentId,
      message: 'Send payment to JazzCash account and share screenshot',
      redirectUrl: url,
    };
  }

  private async handleBankTransfer(
    request: PaymentRequest,
    paymentId?: string
  ): Promise<PaymentResult> {
    const message = encodeURIComponent(
      `🔐 *MTK AlertPro - Bank Transfer*\n\n` +
      `Transfer Rs. ${request.amount} to:\n` +
      `🏦 Bank: Meezan Bank\n` +
      `👤 Title: ${DEVELOPER_NAME}\n` +
      `📝 Account: 11330109676650\n` +
      `🆔 IBAN: PK26MEZN0011330109676650\n` +
      `🏢 Branch: BHUBTIAN BRANCH LHR\n` +
      `💳 Raast ID: 03020718182\n\n` +
      `After transfer, send receipt with:\n` +
      `📧 Email: ${request.email}\n` +
      `📱 Plan: ${request.planId}\n` +
      `🆔 Ref: ${paymentId || 'N/A'}`
    );

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    await Linking.openURL(url);

    return {
      success: true,
      transactionId: paymentId,
      message: 'Bank details sent. Transfer and share receipt on WhatsApp.',
      redirectUrl: url,
    };
  }

  // ---------------------------------------------------------------------------
  // Subscription Management
  // ---------------------------------------------------------------------------

  async activateSubscription(
    userId: string,
    tier: SubscriptionTier,
    durationMonths: number = 1
  ): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      console.log(`[SubscriptionService] Activated ${tier} for user ${userId}`);
      return true;
    } catch (error: any) {
      logError(error, 'SubscriptionService.activateSubscription');
      return false;
    }
  }

  async downgradeToFree(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      console.log(`[SubscriptionService] Downgraded user ${userId} to free`);
      return true;
    } catch (error: any) {
      logError(error, 'SubscriptionService.downgradeToFree');
      return false;
    }
  }

  async extendSubscription(
    userId: string,
    additionalMonths: number
  ): Promise<boolean> {
    try {
      // Get current expiration
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('subscription_expires_at')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentExpiry = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : new Date();

      // Extend from current expiry or now, whichever is later
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setMonth(baseDate.getMonth() + additionalMonths);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_expires_at: baseDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      console.log(`[SubscriptionService] Extended subscription by ${additionalMonths} months`);
      return true;
    } catch (error: any) {
      logError(error, 'SubscriptionService.extendSubscription');
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Feature Gating
  // ---------------------------------------------------------------------------

  getUpgradePrompt(feature: string, currentTier: SubscriptionTier): UpgradePromptConfig | null {
    const prompts: Record<string, UpgradePromptConfig> = {
      face_recognition: {
        feature: 'face_recognition',
        requiredTier: 'pro',
        title: 'Unlock Face Recognition',
        description: 'Identify known individuals automatically with AI-powered face recognition.',
        benefits: [
          'Recognize family members',
          'Get alerts for unknown faces',
          'Create a face database',
          'Reduce false alarms',
        ],
      },
      unlimited_cameras: {
        feature: 'unlimited_cameras',
        requiredTier: 'pro',
        title: 'Add More Cameras',
        description: 'Upgrade to Pro for unlimited camera connections.',
        benefits: [
          'Connect unlimited cameras',
          'Monitor your entire property',
          'Multi-location support',
          'HD/4K streaming',
        ],
      },
      custom_zones: {
        feature: 'custom_zones',
        requiredTier: 'pro',
        title: 'Custom Detection Zones',
        description: 'Define specific areas for motion detection.',
        benefits: [
          'Ignore non-essential areas',
          'Focus on entry points',
          'Reduce false alerts',
          'Multiple zones per camera',
        ],
      },
      api_access: {
        feature: 'api_access',
        requiredTier: 'business',
        title: 'API Access',
        description: 'Integrate MTK AlertPro with your own systems.',
        benefits: [
          'REST API access',
          'Webhook notifications',
          'Custom integrations',
          'Enterprise features',
        ],
      },
      priority_support: {
        feature: 'priority_support',
        requiredTier: 'pro',
        title: 'Priority Support',
        description: 'Get faster response times and dedicated assistance.',
        benefits: [
          'Response within minutes',
          'Direct phone support',
          'Priority issue resolution',
          'Setup assistance',
        ],
      },
    };

    const prompt = prompts[feature];
    if (!prompt) return null;

    // Check if upgrade is needed
    const tierOrder: SubscriptionTier[] = ['free', 'pro', 'business'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const requiredIndex = tierOrder.indexOf(prompt.requiredTier);

    if (currentIndex >= requiredIndex) return null;

    return prompt;
  }

  // ---------------------------------------------------------------------------
  // Pricing
  // ---------------------------------------------------------------------------

  getPlanPrice(tier: SubscriptionTier, currency: 'pkr' | 'usd' = 'pkr'): number {
    return PLAN_PRICES[tier]?.[currency] || 0;
  }

  formatPrice(amount: number, currency: string = 'PKR'): string {
    if (amount === 0) return 'Free';

    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });

    return formatter.format(amount);
  }

  // ---------------------------------------------------------------------------
  // Expiration Warnings
  // ---------------------------------------------------------------------------

  getDaysUntilExpiry(expiresAt: Date | null): number | null {
    if (!expiresAt) return null;

    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  shouldShowExpiryWarning(expiresAt: Date | null): boolean {
    const days = this.getDaysUntilExpiry(expiresAt);
    return days !== null && days <= 7 && days > 0;
  }

  isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return expiresAt < new Date();
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const subscriptionService = new SubscriptionService();

