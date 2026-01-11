import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Wifi, Router, Search, CheckCircle } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

export function RouterLANGuide() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Wifi size={32} color={colors.brand.accent} />
        </View>
        <Text style={styles.title}>Find Cameras on Your Network</Text>
        <Text style={styles.subtitle}>Follow these steps to discover IP cameras on your LAN</Text>
      </View>

      {/* Step 1 */}
      <View style={styles.step}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Check Your Router</Text>
          <Text style={styles.stepDescription}>
            Log into your router's admin panel (usually at 192.168.1.1 or 192.168.0.1) and look for "Connected Devices" or "DHCP Clients" list.
          </Text>
          <View style={styles.ipExample}>
            <Text style={styles.ipText}>Common Router IPs:</Text>
            <Text style={styles.ipValue}>• 192.168.1.1</Text>
            <Text style={styles.ipValue}>• 192.168.0.1</Text>
            <Text style={styles.ipValue}>• 10.0.0.1</Text>
          </View>
        </View>
      </View>

      {/* Step 2 */}
      <View style={styles.step}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Identify Camera Devices</Text>
          <Text style={styles.stepDescription}>
            Look for devices with names like "IPCam", "Camera", or manufacturer names (Hikvision, Dahua, Reolink, etc.). Note their IP addresses.
          </Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Pro Tip:</Text>
            <Text style={styles.tipText}>
              Cameras often have MAC addresses starting with specific prefixes. Common ones: Hikvision (44:19:B6), Dahua (64:32:A8), Reolink (BC:2E:48)
            </Text>
          </View>
        </View>
      </View>

      {/* Step 3 */}
      <View style={styles.step}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>3</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Use Network Scanner (Optional)</Text>
          <Text style={styles.stepDescription}>
            Download a network scanner app like "Fing" or "Advanced IP Scanner" to automatically discover all devices on your network.
          </Text>
          <View style={styles.appCard}>
            <Text style={styles.appTitle}>Recommended Apps:</Text>
            <Text style={styles.appItem}>📱 Fing (iOS/Android)</Text>
            <Text style={styles.appItem}>💻 Advanced IP Scanner (Windows)</Text>
            <Text style={styles.appItem}>🔍 Angry IP Scanner (Cross-platform)</Text>
          </View>
        </View>
      </View>

      {/* Step 4 */}
      <View style={styles.step}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>4</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Test Camera Access</Text>
          <Text style={styles.stepDescription}>
            Once you have the IP address, try accessing the camera's web interface by entering http://[CAMERA_IP] in your browser. You may need default credentials from the manual.
          </Text>
          <View style={styles.defaultCreds}>
            <Text style={styles.credsTitle}>Common Default Logins:</Text>
            <Text style={styles.credsItem}>Hikvision: admin / 12345</Text>
            <Text style={styles.credsItem}>Dahua: admin / admin</Text>
            <Text style={styles.credsItem}>Reolink: admin / [blank]</Text>
          </View>
        </View>
      </View>

      {/* Step 5 */}
      <View style={[styles.step, styles.lastStep]}>
        <View style={[styles.stepNumber, styles.successNumber]}>
          <CheckCircle size={24} color="white" />
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Add to MTK AlertPro</Text>
          <Text style={styles.stepDescription}>
            Return to the Add Camera screen, select your camera brand, and enter the IP address you found. Include the username and password for authentication.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⚠️ Important: Ensure your phone and cameras are on the same network (Wi-Fi) for local access.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.bg.secondary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  lastStep: {
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: colors.brand.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  successNumber: {
    backgroundColor: colors.status.success,
  },
  stepNumberText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  ipExample: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ipValue: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  tipCard: {
    backgroundColor: colors.status.warning + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.status.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tipTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.status.warning,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  appCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  appTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  appItem: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  defaultCreds: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  credsTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  credsItem: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  footer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.status.warning + '40',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
