import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Shield,
  Moon,
  ChevronRight,
  LogOut,
  Crown,
  HelpCircle,
  Info,
} from 'lucide-react-native';
import { useAuthStore, useSettingsStore } from '@/stores';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { notifications, detection, display, setNotifications, setDisplay } = useSettingsStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    isLast = false,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[styles.settingItem, !isLast && styles.settingItemBorder]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={colors.text.muted} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.profilePlan}>
              <Crown size={14} color={colors.status.warning} />
              <Text style={styles.profilePlanText}>
                {user?.subscriptionTier || 'Free'} Plan
              </Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.sectionCard}>
          <SettingItem
            icon={<Bell size={20} color="#06B6D4" />}
            title="Push Notifications"
            subtitle="Receive alert notifications"
            rightElement={
              <Switch
                value={notifications.enabled}
                onValueChange={(value) => setNotifications({ enabled: value })}
                trackColor={{ false: colors.bg.tertiary, true: colors.brand.red }}
                thumbColor="white"
              />
            }
          />
          <SettingItem
            icon={<Bell size={20} color="#06B6D4" />}
            title="Sound"
            subtitle="Play sound for alerts"
            isLast
            rightElement={
              <Switch
                value={notifications.sound}
                onValueChange={(value) => setNotifications({ sound: value })}
                trackColor={{ false: colors.bg.tertiary, true: colors.brand.red }}
                thumbColor="white"
              />
            }
          />
        </View>

        {/* Display */}
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.sectionCard}>
          <SettingItem
            icon={<Moon size={20} color="#8B5CF6" />}
            title="Dark Mode"
            subtitle="Use dark theme"
            isLast
            rightElement={
              <Switch
                value={display.theme === 'dark'}
                onValueChange={(value) =>
                  setDisplay({ theme: value ? 'dark' : 'light' })
                }
                trackColor={{ false: colors.bg.tertiary, true: colors.brand.red }}
                thumbColor="white"
              />
            }
          />
        </View>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionCard}>
          <SettingItem
            icon={<Shield size={20} color={colors.status.success} />}
            title="Detection Sensitivity"
            subtitle={`Cooldown: ${detection.cooldownSeconds}s`}
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingItem
            icon={<HelpCircle size={20} color={colors.status.warning} />}
            title="Help Center"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Info size={20} color={colors.text.muted} />}
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton} activeOpacity={0.8}>
          <LogOut size={20} color={colors.brand.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.brand.red,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  profilePlan: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  profilePlanText: {
    fontSize: fontSize.sm,
    color: colors.status.warning,
    marginLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.brand.red,
    marginLeft: spacing.sm,
  },
});
