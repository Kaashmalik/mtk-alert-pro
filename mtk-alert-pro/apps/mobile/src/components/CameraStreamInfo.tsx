import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { AlertCircle, ExternalLink } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

export function CameraStreamInfo() {
  const openGuide = () => {
    Linking.openURL('https://github.com/your-repo/docs/camera-streaming');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertCircle size={20} color={colors.status.warning} />
        <Text style={styles.title}>RTSP Streaming Setup Required</Text>
      </View>
      
      <Text style={styles.description}>
        To view live camera streams, you need to set up an RTSP-to-HLS conversion service. This is required because:
      </Text>

      <View style={styles.bulletList}>
        <Text style={styles.bullet}>• Mobile browsers don't support RTSP directly</Text>
        <Text style={styles.bullet}>• HLS provides better mobile compatibility</Text>
        <Text style={styles.bullet}>• Reduces bandwidth usage with adaptive streaming</Text>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>Quick Setup Options:</Text>
        <Text style={styles.setupItem}>1. Use FFmpeg on your server</Text>
        <Text style={styles.setupItem}>2. Deploy a cloud streaming service</Text>
        <Text style={styles.setupItem}>3. Use Frigate/Scrypted for NVR</Text>
      </View>

      <TouchableOpacity style={styles.guideButton} onPress={openGuide}>
        <Text style={styles.guideText}>View Setup Guide</Text>
        <ExternalLink size={16} color={colors.brand.accent} />
      </TouchableOpacity>

      <Text style={styles.note}>
        💡 For now, alerts and recordings will work without live streaming. You'll receive notifications when motion is detected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.status.warning + '40',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.status.warning,
    marginLeft: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bulletList: {
    marginBottom: spacing.md,
  },
  bullet: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  setupCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  setupTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  setupItem: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  guideText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brand.accent,
    marginRight: spacing.xs,
  },
  note: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
