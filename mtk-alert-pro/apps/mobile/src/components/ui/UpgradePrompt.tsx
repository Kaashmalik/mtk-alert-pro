/**
 * Upgrade Prompt Component
 * 
 * Professional feature gating with beautiful upgrade prompts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Crown,
  Lock,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius, shadows, palette } from '@/lib/theme';
import { useSubscriptionStore, useIsPremium } from '@/stores/subscriptionStore';
import { subscriptionService, type UpgradePromptConfig } from '@/lib/subscription/subscriptionService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface UpgradePromptProps {
  feature: string;
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
}

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

// ============================================================================
// Upgrade Prompt Modal
// ============================================================================

export function UpgradePrompt({
  feature,
  visible,
  onClose,
  onUpgrade,
}: UpgradePromptProps) {
  const currentTier = useSubscriptionStore((state) => state.currentTier);
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [opacityAnim] = useState(new Animated.Value(0));

  const config = subscriptionService.getUpgradePrompt(feature, currentTier);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!config) return null;

  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.promptIcon}>
            <LinearGradient
              colors={[palette.amber[500], palette.amber[600]]}
              style={styles.promptIconGradient}
            >
              <Crown size={32} color="white" />
            </LinearGradient>
            <View style={styles.sparkleContainer}>
              <Sparkles size={16} color={palette.amber[400]} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.promptTitle}>{config.title}</Text>
          <Text style={styles.promptDescription}>{config.description}</Text>

          {/* Benefits */}
          <View style={styles.benefitsList}>
            {config.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.benefitCheck}>
                  <Check size={12} color={colors.status.success} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Upgrade Button */}
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[palette.red[500], palette.red[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Zap size={20} color="white" fill="white" />
              <Text style={styles.upgradeText}>
                Upgrade to {config.requiredTier.charAt(0).toUpperCase() + config.requiredTier.slice(1)}
              </Text>
              <ArrowRight size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Maybe Later */}
          <TouchableOpacity onPress={onClose} style={styles.laterButton}>
            <Text style={styles.laterText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// Feature Gate Component
// ============================================================================

export function FeatureGate({
  feature,
  children,
  fallback,
  showLockIcon = true,
}: FeatureGateProps) {
  const currentTier = useSubscriptionStore((state) => state.currentTier);
  const checkFeatureAccess = useSubscriptionStore((state) => state.checkFeatureAccess);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const hasAccess = checkFeatureAccess(feature as any);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowUpgrade(true)}
        activeOpacity={0.8}
        style={styles.lockedContainer}
      >
        {showLockIcon && (
          <View style={styles.lockBadge}>
            <Lock size={12} color={palette.amber[500]} />
            <Text style={styles.lockText}>PRO</Text>
          </View>
        )}
        <View style={styles.lockedOverlay}>
          {children}
        </View>
      </TouchableOpacity>

      <UpgradePrompt
        feature={feature}
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}

// ============================================================================
// Premium Badge
// ============================================================================

export function PremiumBadge({ size = 'medium', style }: PremiumBadgeProps) {
  const isPremium = useIsPremium();

  if (!isPremium) return null;

  const sizes = {
    small: { icon: 10, padding: spacing.xs, fontSize: fontSize['2xs'] },
    medium: { icon: 12, padding: spacing.sm, fontSize: fontSize.xs },
    large: { icon: 16, padding: spacing.md, fontSize: fontSize.sm },
  };

  const config = sizes[size];

  return (
    <View style={[styles.premiumBadge, { paddingHorizontal: config.padding }, style]}>
      <Crown size={config.icon} color={palette.amber[500]} />
      <Text style={[styles.premiumBadgeText, { fontSize: config.fontSize }]}>
        PRO
      </Text>
    </View>
  );
}

// ============================================================================
// Inline Upgrade CTA
// ============================================================================

interface InlineUpgradeProps {
  feature: string;
  compact?: boolean;
}

export function InlineUpgradeCTA({ feature, compact = false }: InlineUpgradeProps) {
  const currentTier = useSubscriptionStore((state) => state.currentTier);
  const config = subscriptionService.getUpgradePrompt(feature, currentTier);

  if (!config) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/subscription')}
      activeOpacity={0.9}
      style={[styles.inlineCta, compact && styles.inlineCtaCompact]}
    >
      <LinearGradient
        colors={['rgba(239, 68, 68, 0.1)', 'rgba(245, 158, 11, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.inlineCtaGradient}
      >
        <View style={styles.inlineCtaIcon}>
          <Crown size={compact ? 16 : 20} color={palette.amber[500]} />
        </View>
        <View style={styles.inlineCtaContent}>
          <Text style={styles.inlineCtaTitle}>{config.title}</Text>
          {!compact && (
            <Text style={styles.inlineCtaDesc} numberOfLines={1}>
              {config.description}
            </Text>
          )}
        </View>
        <ArrowRight size={18} color={colors.text.secondary} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============================================================================
// Usage Limit Warning
// ============================================================================

interface UsageLimitProps {
  current: number;
  max: number;
  label: string;
  onUpgrade?: () => void;
}

export function UsageLimitWarning({ current, max, label, onUpgrade }: UsageLimitProps) {
  const percentage = max === Infinity ? 0 : (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  if (max === Infinity || percentage < 80) return null;

  return (
    <View style={[styles.limitWarning, isAtLimit && styles.limitWarningCritical]}>
      <View style={styles.limitContent}>
        <Text style={styles.limitText}>
          {isAtLimit
            ? `${label} limit reached`
            : `${max - current} ${label} remaining`}
        </Text>
        <Text style={styles.limitSubtext}>
          {current} of {max === Infinity ? '∞' : max} used
        </Text>
      </View>
      {isAtLimit && (
        <TouchableOpacity
          onPress={onUpgrade || (() => router.push('/subscription'))}
          style={styles.limitUpgrade}
        >
          <Text style={styles.limitUpgradeText}>Upgrade</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    backgroundColor: colors.bg.elevated,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
  },
  promptIcon: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  promptIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  promptTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  promptDescription: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  upgradeButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  upgradeText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  laterButton: {
    paddingVertical: spacing.sm,
  },
  laterText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  lockedContainer: {
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    zIndex: 10,
  },
  lockText: {
    fontSize: fontSize['2xs'],
    fontWeight: '700',
    color: palette.amber[500],
  },
  lockedOverlay: {
    opacity: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warningBg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  premiumBadgeText: {
    fontWeight: '700',
    color: palette.amber[500],
  },
  inlineCta: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  inlineCtaCompact: {
    // Compact styles if needed
  },
  inlineCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  inlineCtaIcon: {
    marginRight: spacing.md,
  },
  inlineCtaContent: {
    flex: 1,
  },
  inlineCtaTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inlineCtaDesc: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warningBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  limitWarningCritical: {
    backgroundColor: colors.status.errorBg,
  },
  limitContent: {
    flex: 1,
  },
  limitText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.status.warning,
  },
  limitSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  limitUpgrade: {
    backgroundColor: colors.status.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  limitUpgradeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: 'white',
  },
});

