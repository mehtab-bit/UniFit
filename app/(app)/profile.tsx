import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAnimationTheme, PerformanceMode } from '../../context/AnimationContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function ProfileScreen() {
  useScreenAnnouncement('Profile screen. Manage your preferences, performance animation mode, speech speed, and accessibility settings.');

  const router = useRouter();
  const { user, profile, signOut, resetOnboarding } = useAuth();
  const {
    audioGuidance,
    captionsEnabled,
    vibrationFeedback,
    speechRate,
    setAudioGuidance,
    setCaptionsEnabled,
    setVibrationFeedback,
    setSpeechRate,
    testSpeechRateSample,
    isScreenReaderActive,
  } = useAccessibility();

  const { performanceMode, setPerformanceMode, isAutoDetected } = useAnimationTheme();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const speechSpeedOptions = [
    { label: '0.8x', speedText: 'Slower', value: 0.8 },
    { label: '1.0x', speedText: 'Normal', value: 1.0 },
    { label: '1.25x', speedText: 'Faster', value: 1.25 },
    { label: '1.5x', speedText: 'Fast', value: 1.5 },
  ];

  const performanceOptions: { mode: PerformanceMode; title: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
    {
      mode: 'standard',
      title: 'Standard (Full Motion)',
      desc: 'Smooth 60 FPS Reanimated UI springs, hero floating & counting animations.',
      icon: 'zap',
    },
    {
      mode: 'battery_saver',
      title: 'Battery Saver',
      desc: 'Optimized transitions, disabled continuous background loops.',
      icon: 'battery-charging',
    },
    {
      mode: 'low_end',
      title: 'Low-End Device',
      desc: 'Instant transitions, zero transform scaling, minimum CPU & battery load.',
      icon: 'cpu',
    },
  ];

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (err) {
      console.warn('Sign out failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRetakeQuiz = async () => {
    await resetOnboarding();
    router.replace('/quiz');
  };

  const formatGoal = (g: string | null | undefined) => {
    if (g === 'lose_fat') return 'Fat Loss';
    if (g === 'muscle_gain') return 'Muscle Gain';
    return 'Maintain & Tone';
  };

  const formatLifestyle = (l: string | null | undefined) => {
    if (l === 'very_active') return 'Very Active';
    if (l === 'moderate') return 'Moderately Active';
    if (l === 'light') return 'Lightly Active';
    return 'Sedentary';
  };

  const formatDiet = (d: string | null | undefined) => {
    if (d === 'vegan') return 'Vegan';
    if (d === 'vegetarian') return 'Vegetarian';
    if (d === 'eggetarian') return 'Eggetarian';
    return 'Balanced Non-Veg';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <Text style={styles.headerTitle}>Profile & Preferences</Text>
        <Text style={styles.headerSubtitle}>Manage account, performance & accessibility</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Hero Card */}
        <CardSpringEntry index={0}>
          <View
            style={styles.profileHeroCard}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`Account: ${user?.fullName || profile?.full_name || 'UniFit Athlete'}. Goal: ${formatGoal(profile?.fitness_goal)}.`}
          >
            <View style={styles.profileHeroRow}>
              <View style={styles.avatarCircle} accessible={false} importantForAccessibility="no">
                <Text style={styles.avatarText}>
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userInfoCol}>
                <Text style={styles.userName}>{user?.fullName || profile?.full_name || 'UniFit Athlete'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'user@unifit.io'}</Text>
                <View style={styles.goalPill}>
                  <Feather name="target" size={11} color="#00C8FF" style={{ marginRight: 4 }} />
                  <Text style={styles.goalPillText}>{formatGoal(profile?.fitness_goal)}</Text>
                </View>
              </View>
            </View>
          </View>
        </CardSpringEntry>

        {/* Engine Calibrated Fitness Profile Summary */}
        <Text style={styles.sectionHeading} accessible={true} accessibilityRole="header">
          FITNESS BASELINE
        </Text>

        <CardSpringEntry index={1}>
          <View style={styles.settingsCard}>
            <View style={styles.calibrationHeaderRow}>
              <View style={styles.calibIconBox}>
                <Feather name="sliders" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calibTitle}>Current Baseline Parameters</Text>
                <Text style={styles.calibSub}>Informed by your personalized 12-step assessment</Text>
              </View>
            </View>

            <View style={styles.calibGrid}>
              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Age & Sex</Text>
                <Text style={styles.calibItemVal}>
                  {profile?.age || 28} yrs • {profile?.sex ? profile.sex.toUpperCase() : 'MALE'}
                </Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Height & Weight</Text>
                <Text style={styles.calibItemVal}>
                  {profile?.height_cm || 175} cm • {profile?.weight_kg || 72} kg
                </Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Primary Goal</Text>
                <Text style={styles.calibItemVal}>{formatGoal(profile?.fitness_goal)}</Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Daily Activity</Text>
                <Text style={styles.calibItemVal}>{formatLifestyle(profile?.lifestyle_activity)}</Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Diet Pattern</Text>
                <Text style={styles.calibItemVal}>{formatDiet(profile?.diet)}</Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Experience Level</Text>
                <Text style={styles.calibItemVal}>
                  {profile?.strength_experience === 'regularly_train' ? 'Regular' : 'Base / Functional'}
                </Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Equipment</Text>
                <Text style={styles.calibItemVal}>
                  {profile?.strength_equipment && profile.strength_equipment.length > 0
                    ? profile.strength_equipment.join(', ').replace(/_/g, ' ')
                    : 'Chair & Wall'}
                </Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Accessibility</Text>
                <Text style={styles.calibItemVal}>
                  {profile?.accessibility_needs && profile.accessibility_needs.length > 0
                    ? profile.accessibility_needs.join(', ').replace(/_/g, ' ')
                    : 'Standard'}
                </Text>
              </View>

              <View style={styles.calibItem}>
                <Text style={styles.calibItemLabel}>Safety / Restriction</Text>
                <Text style={styles.calibItemVal}>
                  {profile?.has_exercise_restriction ? 'Restriction Noted' : 'None Reported'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRetakeQuiz}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Update baseline assessment"
              style={styles.retakeInlineBtn}
            >
              <Text style={styles.retakeInlineText}>Edit Assessment Responses</Text>
              <Feather name="chevron-right" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </CardSpringEntry>

        {/* Adaptive Animation & Performance Mode Section */}
        <Text style={styles.sectionHeading} accessible={true} accessibilityRole="header">
          Animation & Performance Mode
        </Text>

        <CardSpringEntry index={2}>
          <View style={styles.settingsCard}>
            <View style={styles.perfHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Adaptive UI Motion Engine</Text>
                <Text style={styles.switchSubtitle}>
                  Tuned for 60 FPS native UI thread rendering across low-end to flagship phones
                </Text>
              </View>
              {isAutoDetected && (
                <View style={styles.autoBadge}>
                  <Text style={styles.autoBadgeText}>Auto-calibrated</Text>
                </View>
              )}
            </View>

            {/* Performance Mode Radio Buttons */}
            <View
              accessible={true}
              accessibilityRole="radiogroup"
              accessibilityLabel="Performance and animation modes"
            >
              {performanceOptions.map((opt) => {
                const isSelected = performanceMode === opt.mode;
                return (
                  <ScalePressable
                    key={opt.mode}
                    activeScale={0.98}
                    onPress={() => setPerformanceMode(opt.mode)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                    accessibilityLabel={`${opt.title}. ${opt.desc}`}
                    accessibilityHint={`Double tap to activate ${opt.title}`}
                    style={[
                      styles.perfOptionCard,
                      isSelected && styles.perfOptionCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.perfIconBox,
                        isSelected && { backgroundColor: Colors.primaryMuted },
                      ]}
                    >
                      <Feather
                        name={opt.icon}
                        size={18}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                    </View>
                    <View style={styles.perfTextCol}>
                      <Text
                        style={[
                          styles.perfOptionTitle,
                          isSelected && styles.perfOptionTitleSelected,
                        ]}
                      >
                        {opt.title}
                      </Text>
                      <Text style={styles.perfOptionDesc}>{opt.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </ScalePressable>
                );
              })}
            </View>

            {typeof __DEV__ !== 'undefined' && __DEV__ ? (
              <>
                {/* Performance Test Screen Launcher — developer tooling only */}
                <ScalePressable
                  activeScale={0.98}
                  onPress={() => router.push('/(app)/performance-test' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Open 60 FPS Performance Test Screen"
                  accessibilityHint="Tests animated cards, progress rings, counters, and motion engine under stress"
                  style={styles.stressTestBtn}
                >
                  <Feather name="activity" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stressTestTitle}>Launch Performance Stress Test</Text>
                    <Text style={styles.stressTestSub}>
                      Benchmark 20 cards, SVG rings, and motion analysis engine
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.primary} />
                </ScalePressable>
              </>
            ) : null}
          </View>
        </CardSpringEntry>

        {/* Accessibility Settings Section */}
        <Text style={styles.sectionHeading} accessible={true} accessibilityRole="header">
          Accessibility Settings
        </Text>

        <CardSpringEntry index={2}>
          <View style={styles.settingsCard}>
            {/* Audio Workout Guidance */}
            <View
              style={styles.switchRow}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel={`Audio workout guidance. ${audioGuidance ? 'On' : 'Off'}.`}
              accessibilityHint="Toggles spoken rep counts and form corrections during workouts"
              accessibilityState={{ checked: audioGuidance }}
            >
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Audio Workout Guidance</Text>
                <Text style={styles.switchSubtitle}>Spoken rep counts & real-time form feedback</Text>
              </View>
              <Switch
                value={audioGuidance}
                onValueChange={setAudioGuidance}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.background}
                accessibilityLabel="Audio workout guidance toggle"
              />
            </View>

            {/* Captions */}
            <View
              style={styles.switchRow}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel={`Captions. ${captionsEnabled ? 'On' : 'Off'}.`}
              accessibilityHint="Toggles large high-contrast visual captions on screen"
              accessibilityState={{ checked: captionsEnabled }}
            >
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Captions</Text>
                <Text style={styles.switchSubtitle}>Large on-screen prompts for deaf & hard of hearing</Text>
              </View>
              <Switch
                value={captionsEnabled}
                onValueChange={setCaptionsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.background}
                accessibilityLabel="Captions toggle"
              />
            </View>

            {/* Vibration Feedback */}
            <View
              style={[styles.switchRow, { borderBottomWidth: 0, paddingBottom: 0 }]}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel={`Vibration feedback. ${vibrationFeedback ? 'On' : 'Off'}.`}
              accessibilityHint="Toggles haptic alerts on rep completions and form corrections"
              accessibilityState={{ checked: vibrationFeedback }}
            >
              <View style={styles.switchTextCol}>
                <Text style={styles.switchTitle}>Vibration Feedback</Text>
                <Text style={styles.switchSubtitle}>Haptic pulses for rep completions and safety cues</Text>
              </View>
              <Switch
                value={vibrationFeedback}
                onValueChange={setVibrationFeedback}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.background}
                accessibilityLabel="Vibration feedback toggle"
              />
            </View>
          </View>
        </CardSpringEntry>

        {/* Speech Speed (Text-to-Speech Rate) Settings */}
        <Text style={styles.sectionHeading} accessible={true} accessibilityRole="header">
          Text-to-Speech Speed
        </Text>

        <CardSpringEntry index={3}>
          <View style={styles.settingsCard}>
            <View style={styles.speedHeaderRow}>
              <View style={styles.speedTitleCol}>
                <Text style={styles.switchTitle}>Audio Guidance Speech Rate</Text>
                <Text style={styles.switchSubtitle}>
                  Adjust the speed of workout audio prompts & exercise form feedback
                </Text>
              </View>
            </View>

            {/* Speech Rate Selector Buttons */}
            <View
              style={styles.speedOptionsGrid}
              accessible={true}
              accessibilityRole="radiogroup"
              accessibilityLabel="Speech rate options"
            >
              {speechSpeedOptions.map((opt) => {
                const isSelected = speechRate === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    activeOpacity={0.7}
                    onPress={() => setSpeechRate(opt.value)}
                    accessible={true}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                    accessibilityLabel={`Speech speed ${opt.label} ${opt.speedText}`}
                    accessibilityHint={`Double tap to set text to speech speed to ${opt.label} (${opt.speedText})`}
                    style={[
                      styles.speedOptionBtn,
                      isSelected && styles.speedOptionBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedOptionLabel,
                        isSelected && styles.speedOptionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.speedOptionSub,
                        isSelected && styles.speedOptionSubSelected,
                      ]}
                    >
                      {opt.speedText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Play Sample Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={testSpeechRateSample}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Test speech speed sample"
              accessibilityHint="Plays an audio preview at the currently selected speech speed"
              style={styles.testSampleBtn}
            >
              <Feather name="volume-2" size={16} color={Colors.primary} style={{ marginRight: 8 }} accessible={false} />
              <Text style={styles.testSampleText}>Play Speech Sample ({speechRate}x)</Text>
            </TouchableOpacity>
          </View>
        </CardSpringEntry>

        {/* System Screen Reader Detection Note */}
        <View
          style={styles.systemInfoBox}
          accessible={true}
          accessibilityLabel={`System Screen Reader Status: ${isScreenReaderActive ? 'Active' : 'Inactive'}. TalkBack on Android and VoiceOver on iOS are managed directly in your device settings.`}
        >
          <Feather name="info" size={18} color={Colors.primary} style={{ marginRight: 10, marginTop: 2 }} accessible={false} />
          <View style={{ flex: 1 }}>
            <Text style={styles.systemInfoTitle}>
              Native Screen Reader:{' '}
              <Text style={{ fontWeight: '700' }}>{isScreenReaderActive ? 'Active (VoiceOver / TalkBack)' : 'Inactive'}</Text>
            </Text>
            <Text style={styles.systemInfoText}>
              UniFit fully supports Android TalkBack and iOS VoiceOver gestures, headings, and semantic labels. OS reading speed is adjusted in your phone's System Settings → Accessibility.
            </Text>
          </View>
        </View>

        {/* Account Actions */}
        <Text style={styles.sectionHeading} accessible={true} accessibilityRole="header">
          Account Actions
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRetakeQuiz}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Retake Onboarding Quiz"
          accessibilityHint="Resets and launches the 12-step personalized assessment"
          style={styles.retakeBtn}
        >
          <Feather name="refresh-cw" size={18} color={Colors.primary} style={{ marginRight: 10 }} accessible={false} />
          <Text style={styles.retakeBtnText}>Retake Onboarding Quiz</Text>
        </TouchableOpacity>

        {/* Prototype Safety & Health Disclaimer */}
        <View
          style={styles.disclaimerBox}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel="Health Notice: UniFit provides general fitness and wellness guidance. It does not provide medical diagnosis, clinical rehabilitation, or individualized medical advice. Always consult a healthcare professional before beginning new physical activities."
        >
          <Feather name="shield" size={14} color={Colors.textSecondary} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: '700' }}>Health Notice:</Text> UniFit provides general fitness and wellness guidance. It does not provide medical diagnosis, clinical rehabilitation, or individualized medical advice. Always consult a healthcare professional before beginning new physical activities.
          </Text>
        </View>

        <PrimaryButton
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          isLoading={isLoggingOut}
          accessibilityLabel="Sign out of UniFit"
          accessibilityHint="Logs out of your current session"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  profileHeroCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#07328D',
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.card,
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#07328D',
    borderWidth: 2,
    borderColor: '#00C8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 12,
    color: '#9E9FA9',
    marginTop: 1,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 255, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.3)',
  },
  goalPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    ...Typography.h3,
    color: Colors.dark,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.xs,
  },
  settingsCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  perfHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  autoBadge: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs - 2,
    borderRadius: Layout.borderRadius.full,
  },
  autoBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  perfOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    minHeight: 56,
  },
  perfOptionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  perfIconBox: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm + 2,
  },
  perfTextCol: {
    flex: 1,
  },
  perfOptionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  perfOptionTitleSelected: {
    color: Colors.primary,
  },
  perfOptionDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Layout.spacing.sm,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  stressTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
  stressTestTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.primary,
  },
  stressTestSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 52,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: Layout.spacing.md,
  },
  switchTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  speedHeaderRow: {
    marginBottom: Layout.spacing.md,
  },
  speedTitleCol: {
    flex: 1,
  },
  speedOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  speedOptionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
    marginHorizontal: 3,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: 52,
  },
  speedOptionBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  speedOptionLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  speedOptionLabelSelected: {
    color: Colors.primary,
  },
  speedOptionSub: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  speedOptionSubSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  testSampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.sm,
    minHeight: 46,
  },
  testSampleText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.primary,
  },
  systemInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  systemInfoTitle: {
    ...Typography.bodySmall,
    color: Colors.dark,
    fontWeight: '600',
    marginBottom: 3,
  },
  systemInfoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    minHeight: 52,
  },
  retakeBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.primary,
  },
  signOutBtn: {
    width: '100%',
    marginBottom: Layout.spacing.lg,
  },
  calibrationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  calibIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  calibTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text,
  },
  calibSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  calibGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  calibItem: {
    width: '48%',
    marginBottom: 4,
  },
  calibItemLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calibItemVal: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  retakeInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  retakeInlineText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm + 2,
    marginVertical: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
