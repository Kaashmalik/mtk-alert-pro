import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as MailComposer from 'expo-mail-composer';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Shield,
  Camera,
  Bell,
  Smartphone,
  Send,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';

// Support email
const SUPPORT_EMAIL = 'mtkcodex@gmail.com';

// FAQ Data
const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    questions: [
      {
        q: 'How do I add my first camera?',
        a: 'Go to the Home screen and tap "Add Camera". Enter your camera\'s IP address and select the brand, or enter the RTSP URL manually. The app will generate the correct stream URL for your camera brand.',
      },
      {
        q: 'What camera brands are supported?',
        a: 'MTK Alert Pro supports Hikvision, Dahua, Reolink, Axis, Uniview, Hanwha (Samsung), Vivotek, Amcrest, Foscam, and any ONVIF-compatible camera.',
      },
      {
        q: 'How do I find my camera\'s RTSP URL?',
        a: 'Use our Smart URL Builder: select your camera brand and enter its IP address. The app will automatically generate the correct RTSP URL. You can also check your camera\'s manual or web interface.',
      },
    ],
  },
  {
    id: 'detection',
    title: 'Detection & Alerts',
    icon: Shield,
    questions: [
      {
        q: 'What types of objects can be detected?',
        a: 'MTK Alert Pro detects humans (persons) and vehicles. We specifically filter out animals and other motion to reduce false alarms.',
      },
      {
        q: 'Why am I not receiving alerts?',
        a: 'Check: 1) Push notifications are enabled in Settings, 2) Camera has notifications enabled (camera settings), 3) Detection types (person/vehicle) are enabled for the camera, 4) App has notification permissions in your phone settings.',
      },
      {
        q: 'How do I reduce false alarms?',
        a: 'Adjust the detection sensitivity in camera settings. A higher sensitivity means fewer false positives. You can also disable detection types you don\'t need (e.g., disable vehicle detection if monitoring indoors).',
      },
      {
        q: 'What is Red Alert Mode?',
        a: 'Red Alert Mode is a heightened security state that increases monitoring sensitivity and ensures all cameras actively detect threats. Enable it when you need maximum security.',
      },
    ],
  },
  {
    id: 'cameras',
    title: 'Camera Issues',
    icon: Camera,
    questions: [
      {
        q: 'Camera shows "Connection Failed"',
        a: 'Verify: 1) Camera IP address is correct, 2) Camera is powered on and connected to your network, 3) RTSP port (usually 554) is open, 4) Username/password are correct, 5) You\'re on the same network as the camera.',
      },
      {
        q: 'Video stream is laggy or buffering',
        a: 'Try: 1) Use the sub-stream instead of main stream (lower resolution), 2) Check your internet connection speed, 3) Reduce video quality in Settings, 4) Ensure camera isn\'t overloaded with too many connections.',
      },
      {
        q: 'Can I view cameras remotely?',
        a: 'Yes! Once cameras are added, you can view them from anywhere. Ensure your cameras are accessible from the internet (port forwarding) or use a VPN for secure remote access.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & Sound',
    icon: Bell,
    questions: [
      {
        q: 'How do I change the alarm sound?',
        a: 'Go to Settings → Notifications → Alarm Sound. Choose from Urgent, Siren, Alert, Chime, or Beep. Tap the play button to preview each sound before selecting.',
      },
      {
        q: 'Can I set different sounds for different cameras?',
        a: 'Currently, alarm sound is a global setting. However, you can enable/disable notifications and alarms per camera in the camera\'s detail screen.',
      },
      {
        q: 'Notifications aren\'t making sound',
        a: 'Check: 1) Sound is enabled in Settings → Notifications, 2) Phone is not in silent/vibrate mode, 3) Volume is turned up, 4) Camera has "Sound Alarm" enabled.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    icon: Smartphone,
    questions: [
      {
        q: 'How do I enable biometric login?',
        a: 'Go to Settings → Security → Enable Face ID/Fingerprint. You must have biometrics set up on your device first.',
      },
      {
        q: 'I forgot my password',
        a: 'On the login screen, tap "Forgot Password?" and enter your email. We\'ll send you a reset link.',
      },
      {
        q: 'Is my camera footage secure?',
        a: 'Yes. All connections use encrypted protocols. Your camera credentials are stored securely on your device. We do not store or have access to your video streams.',
      },
    ],
  },
];

export default function HelpScreen() {
  const user = useAuthStore((state) => state.user);
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [issueType, setIssueType] = useState<'bug' | 'feature' | 'question' | 'other'>('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get device info for support
  const getDeviceInfo = () => {
    return `
---
Device Information:
- App Version: ${Constants.expoConfig?.version || '1.0.0'}
- Build: ${Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'N/A'}
- Platform: ${Platform.OS} ${Platform.Version}
- Device: ${Device.modelName || 'Unknown'}
- Brand: ${Device.brand || 'Unknown'}
- User ID: ${user?.id || 'Not logged in'}
- Email: ${user?.email || 'N/A'}
---`;
  };

  // Send support email
  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message.');
      return;
    }

    setIsSending(true);

    const issueTypeLabels = {
      bug: '🐛 Bug Report',
      feature: '✨ Feature Request',
      question: '❓ Question',
      other: '📝 Other',
    };

    const emailSubject = `[MTK Alert Pro] ${issueTypeLabels[issueType]}: ${subject}`;
    const emailBody = `${message}\n\n${getDeviceInfo()}`;

    try {
      const isAvailable = await MailComposer.isAvailableAsync();

      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [SUPPORT_EMAIL],
          subject: emailSubject,
          body: emailBody,
        });
        
        Alert.alert('Email Ready', 'Your email app has been opened with the support message.');
        setSubject('');
        setMessage('');
        setShowContactForm(false);
      } else {
        // Fallback to mailto link
        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'No Email App',
            `Please send your message to ${SUPPORT_EMAIL} manually.\n\nSubject: ${emailSubject}`,
            [{ text: 'Copy Email', onPress: () => {} }, { text: 'OK' }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email. Please try again or email us directly at ' + SUPPORT_EMAIL);
    } finally {
      setIsSending(false);
    }
  };

  // Quick contact via email
  const handleQuickContact = async () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[MTK Alert Pro] Support Request')}`;
    try {
      await Linking.openURL(mailtoUrl);
    } catch {
      Alert.alert('Contact Support', `Email us at: ${SUPPORT_EMAIL}`);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (questionKey: string) => {
    setExpandedQuestion(expandedQuestion === questionKey ? null : questionKey);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Help Center',
          headerStyle: { backgroundColor: colors.bg.secondary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
              <ArrowLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <HelpCircle size={32} color={colors.brand.accent} />
            </View>
            <Text style={styles.headerTitle}>How can we help?</Text>
            <Text style={styles.headerSubtitle}>
              Browse FAQs or contact our support team
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setShowContactForm(!showContactForm)}
            >
              <Mail size={20} color={colors.brand.red} />
              <Text style={styles.quickActionText}>Report Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleQuickContact}
            >
              <MessageSquare size={20} color={colors.brand.accent} />
              <Text style={styles.quickActionText}>Contact Us</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          {showContactForm && (
            <View style={styles.contactForm}>
              <Text style={styles.contactFormTitle}>Send us a message</Text>
              
              {/* Issue Type */}
              <Text style={styles.inputLabel}>Issue Type</Text>
              <View style={styles.issueTypeContainer}>
                {[
                  { id: 'bug', label: '🐛 Bug', color: colors.status.error },
                  { id: 'feature', label: '✨ Feature', color: colors.brand.accent },
                  { id: 'question', label: '❓ Question', color: colors.status.warning },
                  { id: 'other', label: '📝 Other', color: colors.text.muted },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.issueTypeButton,
                      issueType === type.id && { backgroundColor: type.color + '20', borderColor: type.color },
                    ]}
                    onPress={() => setIssueType(type.id as typeof issueType)}
                  >
                    <Text
                      style={[
                        styles.issueTypeText,
                        issueType === type.id && { color: type.color },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description of your issue"
                placeholderTextColor={colors.text.muted}
                value={subject}
                onChangeText={setSubject}
              />

              {/* Message */}
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={colors.text.muted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Device Info Note */}
              <View style={styles.infoNote}>
                <CheckCircle size={16} color={colors.status.success} />
                <Text style={styles.infoNoteText}>
                  Device information will be automatically included to help us diagnose the issue.
                </Text>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                onPress={handleSendEmail}
                disabled={isSending}
              >
                <Send size={20} color="white" />
                <Text style={styles.sendButtonText}>
                  {isSending ? 'Opening Email...' : 'Send to MTK Team'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FAQ Sections */}
          <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
          
          {FAQ_SECTIONS.map((section) => {
            const IconComponent = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <View key={section.id} style={styles.faqSection}>
                <TouchableOpacity
                  style={styles.faqSectionHeader}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.faqSectionIcon}>
                    <IconComponent size={20} color={colors.brand.accent} />
                  </View>
                  <Text style={styles.faqSectionTitle}>{section.title}</Text>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.text.muted} />
                  ) : (
                    <ChevronDown size={20} color={colors.text.muted} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqQuestions}>
                    {section.questions.map((item, index) => {
                      const questionKey = `${section.id}-${index}`;
                      const isQuestionExpanded = expandedQuestion === questionKey;

                      return (
                        <TouchableOpacity
                          key={questionKey}
                          style={styles.faqQuestion}
                          onPress={() => toggleQuestion(questionKey)}
                        >
                          <View style={styles.faqQuestionHeader}>
                            <Text style={styles.faqQuestionText}>{item.q}</Text>
                            {isQuestionExpanded ? (
                              <ChevronUp size={16} color={colors.text.muted} />
                            ) : (
                              <ChevronDown size={16} color={colors.text.muted} />
                            )}
                          </View>
                          {isQuestionExpanded && (
                            <Text style={styles.faqAnswer}>{item.a}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Still Need Help */}
          <View style={styles.stillNeedHelp}>
            <AlertTriangle size={24} color={colors.status.warning} />
            <View style={styles.stillNeedHelpContent}>
              <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
              <Text style={styles.stillNeedHelpText}>
                Our support team is here to help. Send us an email and we'll respond within 24 hours.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleQuickContact}
          >
            <Mail size={20} color="white" />
            <Text style={styles.contactButtonText}>Email MTK Support</Text>
            <ExternalLink size={16} color="white" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>
              MTK Alert Pro v{Constants.expoConfig?.version || '1.0.0'}
            </Text>
            <Text style={styles.appInfoText}>
              © {new Date().getFullYear()} MalikTech. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  contactForm: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  contactFormTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  issueTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  issueTypeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  issueTypeText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.success + '10',
    borderRadius: borderRadius.lg,
  },
  infoNoteText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.status.success,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.red,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: 'white',
    marginLeft: spacing.sm,
  },
  sectionHeader: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  faqSection: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  faqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  faqSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  faqSectionTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  faqQuestions: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  faqQuestion: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  faqQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  stillNeedHelp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.warning + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  stillNeedHelpContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  stillNeedHelpTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stillNeedHelpText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.accent,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  contactButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: 'white',
    marginLeft: spacing.sm,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  appInfoText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginVertical: 2,
  },
});
