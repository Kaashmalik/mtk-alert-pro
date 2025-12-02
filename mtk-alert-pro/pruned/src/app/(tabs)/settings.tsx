import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
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
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      className="flex-row items-center py-4 border-b border-slate-700"
    >
      <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center">
        {icon}
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-slate-400 text-sm mt-0.5">{subtitle}</Text>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color="#64748B" />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-6">
        <Text className="text-white text-2xl font-bold pt-4 pb-6">Settings</Text>

        {/* Profile Section */}
        <View className="bg-slate-800 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-brand-red rounded-full items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-semibold text-lg">
                {user?.displayName || 'User'}
              </Text>
              <Text className="text-slate-400">{user?.email}</Text>
              <View className="flex-row items-center mt-1">
                <Crown size={14} color="#F59E0B" />
                <Text className="text-amber-500 text-sm ml-1 capitalize">
                  {user?.subscriptionTier || 'Free'} Plan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <Text className="text-slate-400 text-sm font-medium mb-2 uppercase">
          Notifications
        </Text>
        <View className="bg-slate-800 rounded-2xl px-4 mb-6">
          <SettingItem
            icon={<Bell size={20} color="#06B6D4" />}
            title="Push Notifications"
            subtitle="Receive alert notifications"
            rightElement={
              <Switch
                value={notifications.enabled}
                onValueChange={(value) => setNotifications({ enabled: value })}
                trackColor={{ false: '#475569', true: '#EF4444' }}
                thumbColor="white"
              />
            }
          />
          <SettingItem
            icon={<Bell size={20} color="#06B6D4" />}
            title="Sound"
            subtitle="Play sound for alerts"
            rightElement={
              <Switch
                value={notifications.sound}
                onValueChange={(value) => setNotifications({ sound: value })}
                trackColor={{ false: '#475569', true: '#EF4444' }}
                thumbColor="white"
              />
            }
          />
        </View>

        {/* Display */}
        <Text className="text-slate-400 text-sm font-medium mb-2 uppercase">
          Display
        </Text>
        <View className="bg-slate-800 rounded-2xl px-4 mb-6">
          <SettingItem
            icon={<Moon size={20} color="#8B5CF6" />}
            title="Dark Mode"
            subtitle="Use dark theme"
            rightElement={
              <Switch
                value={display.theme === 'dark'}
                onValueChange={(value) =>
                  setDisplay({ theme: value ? 'dark' : 'light' })
                }
                trackColor={{ false: '#475569', true: '#EF4444' }}
                thumbColor="white"
              />
            }
          />
        </View>

        {/* Security */}
        <Text className="text-slate-400 text-sm font-medium mb-2 uppercase">
          Security
        </Text>
        <View className="bg-slate-800 rounded-2xl px-4 mb-6">
          <SettingItem
            icon={<Shield size={20} color="#10B981" />}
            title="Detection Sensitivity"
            subtitle={`Cooldown: ${detection.cooldownSeconds}s`}
            onPress={() => {}}
          />
        </View>

        {/* Support */}
        <Text className="text-slate-400 text-sm font-medium mb-2 uppercase">
          Support
        </Text>
        <View className="bg-slate-800 rounded-2xl px-4 mb-6">
          <SettingItem
            icon={<HelpCircle size={20} color="#F59E0B" />}
            title="Help Center"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Info size={20} color="#64748B" />}
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500/20 rounded-2xl p-4 flex-row items-center justify-center mb-8"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-500 font-semibold ml-2">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
