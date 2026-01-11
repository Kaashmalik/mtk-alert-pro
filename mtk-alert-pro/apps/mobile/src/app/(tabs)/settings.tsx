import { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Smartphone,
  Info,
  CreditCard,
  Lock,
  Eye,
  Zap,
  Volume2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore, useSettingsStore, useSubscriptionStore, useIsPremium } from '@/stores';
import { profileService } from '@/lib/profile/profileService';
import { designSystem } from '@/theme/design-system';

export default function SettingsScreen() {
  const { signOut, user } = useAuthStore();
  const {
    theme,
    notifications,
    detection,
    security,
    setTheme,
    setNotifications,
    setDetection,
    setSecurity
  } = useSettingsStore();
  const { currentTier } = useSubscriptionStore();
  const isPremium = useIsPremium();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const SettingSection = ({ title, children, delay }: { title: string; children: React.ReactNode, delay: number }) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </Animated.View>
  );

  const SettingItem = ({
    icon: Icon,
    color,
    label,
    value,
    type = 'link',
    onPress,
    onToggle
  }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={type === 'link' ? onPress : undefined}
      activeOpacity={type === 'link' ? 0.7 : 1}
      disabled={type === 'toggle'}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>

      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: designSystem.colors.background.tertiary, true: designSystem.colors.primary[500] }}
          thumbColor={'white'}
        />
      ) : type === 'value' ? (
        <Text style={styles.valueText}>{value}</Text>
      ) : (
        <ChevronRight size={20} color={designSystem.colors.text.muted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={designSystem.colors.background.primary} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Profile Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={[
                styles.badge,
                isPremium ? styles.badgePremium : styles.badgeFree
              ]}>
                <Text style={[
                  styles.badgeText,
                  isPremium ? styles.badgeTextPremium : styles.badgeTextFree
                ]}>
                  {isPremium ? 'PRO PLAN' : 'FREE PLAN'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile/edit')}>
              <ChevronRight size={20} color={designSystem.colors.text.secondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* App Settings */}
          <SettingSection title="App Settings" delay={200}>
            <SettingItem
              icon={Moon}
              color={designSystem.colors.primary[500]}
              label="Dark Mode"
              type="toggle"
              value={theme === 'dark'}
              onToggle={(v: boolean) => setTheme(v ? 'dark' : 'light')}
            />
            <SettingItem
              icon={Bell}
              color={designSystem.colors.status.warning}
              label="Push Notifications"
              type="toggle"
              value={notifications.push}
              onToggle={(v: boolean) => setNotifications({ ...notifications, push: v })}
            />
            <SettingItem
              icon={Volume2}
              color={'#EC4899'}
              label="Alarm Sounds"
              type="link"
              onPress={() => router.push('/settings/alarm-sounds')}
            />
            <SettingItem
              icon={Zap}
              color={designSystem.colors.status.danger}
              label="Red Alert Mode"
              type="toggle"
              value={detection.redAlertMode}
              onToggle={(v: boolean) => setDetection({ redAlertMode: v })}
            />
          </SettingSection>

          {/* Subscription */}
          <SettingSection title="Subscription" delay={300}>
            <SettingItem
              icon={CreditCard}
              color={'#8B5CF6'}
              label="Manage Plan"
              type="link"
              onPress={() => router.push('/subscription')}
            />
            <SettingItem
              icon={Shield}
              color={'#10B981'}
              label="Restore Purchases"
              type="link"
              onPress={async () => {
                Alert.alert('Restoring...', 'Looking for your purchases...');
                const result = await profileService.restorePurchases();
                if (result.restored) {
                  Alert.alert('Success!', `Your ${result.tier?.toUpperCase()} subscription has been restored.`);
                } else {
                  Alert.alert('No Purchases', 'No previous purchases found.');
                }
              }}
            />
          </SettingSection>

          {/* Account & Security */}
          <SettingSection title="Account & Security" delay={400}>
            <SettingItem
              icon={User}
              color={'#3B82F6'}
              label="Edit Profile"
              onPress={() => router.push('/profile/edit')}
            />
            <SettingItem
              icon={Lock}
              color={'#F59E0B'}
              label="Change Password"
              onPress={() => router.push('/profile/change-password')}
            />
            <SettingItem
              icon={Smartphone}
              color={'#EC4899'}
              label="Biometric Login"
              type="toggle"
              value={security?.biometricEnabled ?? false}
              onToggle={(v: boolean) => setSecurity?.({ biometricEnabled: v })}
            />
          </SettingSection>

          {/* Support */}
          <SettingSection title="Support" delay={500}>
            <SettingItem
              icon={HelpCircle}
              color={'#6366F1'}
              label="Help Center"
              onPress={() => router.push('/help')}
            />
            <SettingItem
              icon={Info}
              color={'#64748B'}
              label="About"
              type="value"
              value="v1.0.0"
            />
          </SettingSection>

          {/* Sign Out */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <LogOut size={20} color={designSystem.colors.status.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>MTK AlertPro v1.0.0 (Build 102)</Text>
          </Animated.View>

          <View style={{ height: designSystem.spacing.xxxl }} />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: designSystem.spacing.xxl,
    paddingTop: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing.lg,
  },
  headerTitle: {
    fontSize: designSystem.typography.size.xxl,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
  },
  content: {
    paddingHorizontal: designSystem.spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background.secondary,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.layout.radius.xl,
    marginBottom: designSystem.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: designSystem.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: designSystem.typography.size.xl,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: designSystem.spacing.md,
  },
  profileName: {
    fontSize: designSystem.typography.size.lg,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
  },
  profileEmail: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: 2,
    borderRadius: designSystem.layout.radius.sm,
  },
  badgePremium: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeFree: {
    backgroundColor: designSystem.colors.background.tertiary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextPremium: {
    color: designSystem.colors.status.warning,
  },
  badgeTextFree: {
    color: designSystem.colors.text.muted,
  },
  section: {
    marginBottom: designSystem.spacing.xl,
  },
  sectionTitle: {
    fontSize: designSystem.typography.size.sm,
    fontWeight: '600',
    color: designSystem.colors.text.secondary,
    marginBottom: designSystem.spacing.md,
    marginLeft: designSystem.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.xl,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border.default,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designSystem.spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.primary,
  },
  valueText: {
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.text.muted,
  },
  logoutContainer: {
    marginTop: designSystem.spacing.lg,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: designSystem.spacing.xl,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.layout.radius.full,
    marginBottom: designSystem.spacing.lg,
  },
  logoutText: {
    color: designSystem.colors.status.danger,
    fontWeight: '600',
    marginLeft: designSystem.spacing.sm,
  },
  versionText: {
    fontSize: designSystem.typography.size.xs,
    color: designSystem.colors.text.muted,
  },
});
