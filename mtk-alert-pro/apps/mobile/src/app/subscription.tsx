/**
 * Enhanced Subscription Screen
 * 
 * Professional pricing page with multiple payment options
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Check,
  Crown,
  Phone,
  Camera,
  Shield,
  Zap,
  Star,
  MessageCircle,
  Sparkles,
  Lock,
  Clock,
  Users,
  CreditCard,
  Smartphone,
  Building,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius, shadows, palette } from '@/lib/theme';
import { useSubscriptionStore, useIsPremium, type SubscriptionTier } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores';
import { subscriptionService, type PaymentProvider } from '@/lib/subscription';
import { hapticSelection, hapticPrimaryAction, hapticSuccess } from '@/lib/haptics';
import { SkeletonSubscriptionCard } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Component
// ============================================================================

export default function SubscriptionScreen() {
  const { currentTier, plans, isLoading, expiresAt, initialize, usage } = useSubscriptionStore();
  const user = useAuthStore((state) => state.user);
  const isPremium = useIsPremium();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('pro');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider['id']>('whatsapp');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const paymentProviders = subscriptionService.getAvailableProviders();
  const daysUntilExpiry = subscriptionService.getDaysUntilExpiry(expiresAt);
  const showExpiryWarning = subscriptionService.shouldShowExpiryWarning(expiresAt);

  useEffect(() => {
    initialize();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = useCallback(() => {
    initialize();
  }, [initialize]);

  const handlePlanSelect = (planId: SubscriptionTier) => {
    hapticSelection();
    setSelectedPlan(planId);
    if (planId !== 'free' && planId !== currentTier) {
      setShowPaymentOptions(true);
    } else {
      setShowPaymentOptions(false);
    }
  };

  const handlePayment = async () => {
    if (!user?.email) return;
    
    hapticPrimaryAction();
    setIsProcessing(true);
    
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const result = await subscriptionService.initiatePayment({
      planId: selectedPlan,
      userId: user.id,
      email: user.email,
      provider: selectedProvider,
      amount: plan.price,
      currency: plan.currency,
    });

    setIsProcessing(false);
    
    if (result.success) {
      hapticSuccess();
    }
  };

  const getProviderIcon = (providerId: PaymentProvider['id']) => {
    switch (providerId) {
      case 'whatsapp':
        return <MessageCircle size={20} color="#25D366" />;
      case 'easypaisa':
        return <Smartphone size={20} color="#00A651" />;
      case 'jazzcash':
        return <CreditCard size={20} color="#ED1C24" />;
      case 'bank':
        return <Building size={20} color={colors.text.secondary} />;
      default:
        return <CreditCard size={20} color={colors.text.secondary} />;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.loadingContainer}>
          <SkeletonSubscriptionCard />
          <SkeletonSubscriptionCard />
          <SkeletonSubscriptionCard />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
        
        {/* Header */}
        <LinearGradient colors={['#1A1F2E', colors.bg.primary]} style={styles.headerGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Subscription</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={palette.red[500]} />
          }
        >
          {/* Expiry Warning */}
          {showExpiryWarning && (
            <View style={styles.expiryWarning}>
              <AlertCircle size={20} color={colors.status.warning} />
              <View style={styles.expiryContent}>
                <Text style={styles.expiryTitle}>
                  Subscription expires in {daysUntilExpiry} days
                </Text>
                <Text style={styles.expirySubtitle}>Renew now to avoid interruption</Text>
              </View>
            </View>
          )}

          {/* Current Plan Status */}
          {isPremium && (
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanHeader}>
                <Crown size={24} color={palette.amber[500]} />
                <View style={styles.currentPlanInfo}>
                  <Text style={styles.currentPlanLabel}>Current Plan</Text>
                  <Text style={styles.currentPlanName}>
                    {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>{usage.camerasUsed}</Text>
                  <Text style={styles.usageLabel}>Cameras</Text>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>{usage.alertsThisMonth}</Text>
                  <Text style={styles.usageLabel}>Alerts</Text>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>{usage.storageUsedGB}GB</Text>
                  <Text style={styles.usageLabel}>Storage</Text>
                </View>
              </View>
            </View>
          )}

          {/* Hero Section */}
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
            <View style={styles.crownContainer}>
              <LinearGradient colors={[palette.amber[500], palette.amber[600]]} style={styles.crownGradient}>
                <Crown size={32} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Choose Your Plan</Text>
            <Text style={styles.heroSubtitle}>
              Unlock premium features with our affordable plans
            </Text>
          </Animated.View>

          {/* Plan Cards */}
          <View style={styles.planCards}>
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentTier;
              const isSelected = plan.id === selectedPlan;

              return (
                <TouchableOpacity
                  key={plan.id}
                  activeOpacity={0.9}
                  onPress={() => handlePlanSelect(plan.id)}
                  style={[
                    styles.planCard,
                    plan.popular && styles.planCardPopular,
                    isSelected && styles.planCardSelected,
                    isCurrentPlan && styles.planCardCurrent,
                  ]}
                >
                  {plan.popular && (
                    <LinearGradient
                      colors={[palette.red[500], palette.red[600]]}
                      style={styles.popularBadge}
                    >
                      <Sparkles size={12} color="white" />
                      <Text style={styles.popularText}>RECOMMENDED</Text>
                    </LinearGradient>
                  )}

                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Check size={12} color={colors.status.success} />
                      <Text style={styles.currentText}>ACTIVE</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currency}>Rs.</Text>
                      <Text style={[
                        styles.planPrice,
                        plan.popular && { color: palette.red[500] },
                        plan.id === 'business' && { color: palette.amber[500] },
                      ]}>
                        {plan.price === 0 ? 'Free' : plan.price.toLocaleString()}
                      </Text>
                      {plan.price > 0 && <Text style={styles.period}>/mo</Text>}
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <View style={[styles.checkIcon, { backgroundColor: colors.status.successBg }]}>
                          <Check size={12} color={colors.status.success} />
                        </View>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                    {plan.features.length > 5 && (
                      <Text style={styles.moreFeatures}>
                        +{plan.features.length - 5} more features
                      </Text>
                    )}
                  </View>

                  <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                    {isSelected && <Check size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Options */}
          {showPaymentOptions && (
            <Animated.View style={[styles.paymentSection, { opacity: fadeAnim }]}>
              <Text style={styles.paymentTitle}>Payment Method</Text>
              
              <View style={styles.paymentOptions}>
                {paymentProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      hapticSelection();
                      setSelectedProvider(provider.id);
                    }}
                    style={[
                      styles.paymentOption,
                      selectedProvider === provider.id && styles.paymentOptionSelected,
                    ]}
                  >
                    {getProviderIcon(provider.id)}
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{provider.name}</Text>
                      <Text style={styles.paymentDesc}>{provider.description}</Text>
                    </View>
                    <View style={[
                      styles.radioButton,
                      selectedProvider === provider.id && styles.radioButtonSelected,
                    ]}>
                      {selectedProvider === provider.id && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                onPress={handlePayment}
                disabled={isProcessing}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[palette.red[500], palette.red[600]]}
                  style={styles.payButtonGradient}
                >
                  {isProcessing ? (
                    <Text style={styles.payButtonText}>Processing...</Text>
                  ) : (
                    <>
                      <Text style={styles.payButtonText}>
                        Continue to Payment
                      </Text>
                      <Text style={styles.payButtonPrice}>
                        Rs. {plans.find(p => p.id === selectedPlan)?.price.toLocaleString()}/mo
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Lock size={16} color={colors.text.secondary} />
              <Text style={styles.trustText}>Secure</Text>
            </View>
            <View style={styles.trustBadge}>
              <Users size={16} color={colors.text.secondary} />
              <Text style={styles.trustText}>500+ Users</Text>
            </View>
            <View style={styles.trustBadge}>
              <Star size={16} color={colors.text.secondary} />
              <Text style={styles.trustText}>4.8 Rating</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Cancel anytime • No hidden fees</Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  loadingContainer: { flex: 1, padding: spacing.lg },
  headerGradient: { paddingBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg.tertiary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing['6xl'] },
  expiryWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.status.warningBg, marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm },
  expiryContent: { flex: 1 },
  expiryTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.status.warning },
  expirySubtitle: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  currentPlanCard: { backgroundColor: colors.bg.secondary, marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: borderRadius.xl, padding: spacing.lg },
  currentPlanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  currentPlanInfo: { marginLeft: spacing.md },
  currentPlanLabel: { fontSize: fontSize.xs, color: colors.text.secondary },
  currentPlanName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text.primary },
  usageStats: { flexDirection: 'row', justifyContent: 'space-around' },
  usageStat: { alignItems: 'center' },
  usageValue: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.text.primary },
  usageLabel: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  usageDivider: { width: 1, height: 40, backgroundColor: colors.border.default },
  heroSection: { alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl },
  crownContainer: { marginBottom: spacing.lg },
  crownGradient: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', ...shadows.lg },
  heroTitle: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  heroSubtitle: { fontSize: fontSize.base, color: colors.text.secondary, textAlign: 'center' },
  planCards: { paddingHorizontal: spacing.lg, gap: spacing.md },
  planCard: { backgroundColor: colors.bg.secondary, borderRadius: borderRadius['2xl'], padding: spacing.xl, borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  planCardPopular: { borderColor: palette.red[500] },
  planCardSelected: { borderColor: palette.red[500], backgroundColor: colors.bg.tertiary },
  planCardCurrent: { borderColor: colors.status.success },
  popularBadge: { position: 'absolute', top: -12, right: spacing.lg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, gap: spacing.xs },
  popularText: { fontSize: fontSize.xs, fontWeight: '700', color: 'white' },
  currentBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.status.successBg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginBottom: spacing.md, gap: spacing.xs },
  currentText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.status.success },
  planHeader: { marginBottom: spacing.lg },
  planName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  currency: { fontSize: fontSize.lg, color: colors.text.secondary, marginRight: spacing.xs },
  planPrice: { fontSize: fontSize['4xl'], fontWeight: '700', color: colors.text.primary },
  period: { fontSize: fontSize.base, color: colors.text.secondary, marginLeft: spacing.xs },
  featuresList: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  checkIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  featureText: { fontSize: fontSize.sm, color: colors.text.primary, flex: 1 },
  moreFeatures: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs, marginLeft: 28 },
  selectionIndicator: { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center' },
  selectionIndicatorActive: { borderColor: palette.red[500], backgroundColor: palette.red[500] },
  paymentSection: { paddingHorizontal: spacing.lg, marginTop: spacing.xxl },
  paymentTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.md },
  paymentOptions: { gap: spacing.sm },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.secondary, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 2, borderColor: 'transparent' },
  paymentOptionSelected: { borderColor: palette.red[500], backgroundColor: colors.bg.tertiary },
  paymentInfo: { flex: 1, marginLeft: spacing.md },
  paymentName: { fontSize: fontSize.base, fontWeight: '600', color: colors.text.primary },
  paymentDesc: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  radioButton: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center' },
  radioButtonSelected: { borderColor: palette.red[500] },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.red[500] },
  payButton: { marginTop: spacing.lg, borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.lg },
  payButtonDisabled: { opacity: 0.7 },
  payButtonGradient: { alignItems: 'center', paddingVertical: spacing.lg },
  payButtonText: { fontSize: fontSize.lg, fontWeight: '600', color: 'white' },
  payButtonPrice: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  trustBadges: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xxl },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trustText: { fontSize: fontSize.xs, color: colors.text.secondary },
  footer: { alignItems: 'center', paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl },
  footerText: { fontSize: fontSize.sm, color: colors.text.muted, textAlign: 'center' },
});
