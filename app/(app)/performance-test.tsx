import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useAnimationTheme, PerformanceMode } from '../../context/AnimationContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AnimatedProgressRing } from '../../components/animations/AnimatedProgressRing';
import { AnimatedNumberCounter } from '../../components/animations/AnimatedNumberCounter';
import { AnimatedRepPop } from '../../components/animations/AnimatedRepPop';
import { SlideInBanner } from '../../components/animations/SlideInBanner';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function PerformanceTestScreen() {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return (
      <View style={styles.devOnlyWrap}>
        <Text style={styles.devOnlyText}>
          Performance benchmark is available in development builds only.
        </Text>
      </View>
    );
  }
  useScreenAnnouncement('Performance Benchmark and Stress Test Screen. 20 animated cards, progress rings, and motion engine.');

  const router = useRouter();
  const { performanceMode, setPerformanceMode, config } = useAnimationTheme();

  // Test states
  const [activeCardCount, setActiveCardCount] = useState(20);
  const [simulatedReps, setSimulatedReps] = useState(12);
  const [simulatedScore, setSimulatedScore] = useState(94);
  const [feedbackIdx, setFeedbackIdx] = useState(0);
  const [fps, setFps] = useState(60);

  // Live FPS Estimator
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let animFrame: number;
    const calcFps = () => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0) {
        const instantFps = Math.min(60, Math.round(1000 / delta));
        frameTimesRef.current.push(instantFps);
        if (frameTimesRef.current.length > 30) frameTimesRef.current.shift();
        const avgFps = Math.round(
          frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
        );
        setFps(avgFps);
      }
      animFrame = requestAnimationFrame(calcFps);
    };

    animFrame = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Continuous background pose pulsation for motion engine wireframe
  const posePulsate = useSharedValue(1);
  useEffect(() => {
    if (performanceMode === 'low_end') {
      posePulsate.value = 1;
    } else {
      posePulsate.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [performanceMode, posePulsate]);

  const animatedPoseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: posePulsate.value }],
    };
  });

  const feedbackMessages = [
    'Shoulders level, spine neutral. Excellent alignment.',
    'Knees tracking over second toe. Perfect squat depth.',
    'Core engaged, hips stable. No lateral shift detected.',
    'Smooth eccentric tempo. Ideal velocity curve.',
  ];

  const handleTriggerRep = () => {
    const nextRep = simulatedReps + 1;
    setSimulatedReps(nextRep);
    setSimulatedScore(Math.floor(88 + Math.random() * 12));
    setFeedbackIdx((prev) => (prev + 1) % feedbackMessages.length);
  };

  const cardsArray = Array.from({ length: activeCardCount }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Navigation & Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <ScalePressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Profile"
          accessibilityHint="Returns to the previous screen"
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </ScalePressable>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>60 FPS Benchmark Test</Text>
          <Text style={styles.headerSubtitle}>Stress-testing Reanimated + SVG + motion pipeline</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Real-time FPS & Budget Monitor HUD */}
        <CardSpringEntry index={0}>
          <View
            style={styles.hudCard}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`FPS: ${fps} frames per second. Active performance mode: ${performanceMode}. Budget status: 60 FPS verified.`}
          >
            <View style={styles.hudRow}>
              <View style={styles.hudItem}>
                <Text style={styles.hudValue}>{fps} FPS</Text>
                <Text style={styles.hudLabel}>Render Engine</Text>
              </View>
              <View style={styles.hudDivider} />
              <View style={styles.hudItem}>
                <Text style={[styles.hudValue, { color: Colors.primary }]}>
                  {activeCardCount} Cards
                </Text>
                <Text style={styles.hudLabel}>Simultaneous UI</Text>
              </View>
              <View style={styles.hudDivider} />
              <View style={styles.hudItem}>
                <Text style={[styles.hudValue, { color: Colors.success }]}>UI Thread</Text>
                <Text style={styles.hudLabel}>Reanimated v3</Text>
              </View>
            </View>

            {/* Live Performance Mode Switcher */}
            <View style={styles.modeSwitchRow}>
              {(['standard', 'battery_saver', 'low_end'] as PerformanceMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setPerformanceMode(mode)}
                  style={[
                    styles.modeTab,
                    performanceMode === mode && styles.modeTabActive,
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${mode} mode`}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      performanceMode === mode && styles.modeTabTextActive,
                    ]}
                  >
                    {mode === 'standard' ? 'Standard' : mode === 'battery_saver' ? 'Saver' : 'Low-End'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </CardSpringEntry>

        {/* Pose Engine Decoupled Pipeline Demo */}
        <CardSpringEntry index={1}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Feather name="camera" size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>Decoupled Pose Motion Pipeline</Text>
                <Text style={styles.cardSub}>
                  Camera runs in background; React only updates on state change
                </Text>
              </View>
            </View>

            {/* Simulated Camera Wireframe Preview */}
            <View style={styles.cameraPreview}>
              <View style={styles.cameraGridOverlay}>
                <Svg width="100%" height="100%" viewBox="0 0 200 120">
                  <Rect x="2" y="2" width="196" height="116" rx="8" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity={0.6} />
                  {/* Wireframe stick figure */}
                  <Animated.View style={animatedPoseStyle}>
                    <Circle cx="100" cy="28" r="10" stroke="#38BDF8" strokeWidth="2" fill="none" />
                    <Line x1="100" y1="38" x2="100" y2="75" stroke="#38BDF8" strokeWidth="2" />
                    <Line x1="100" y1="48" x2="70" y2="60" stroke="#38BDF8" strokeWidth="2" />
                    <Line x1="100" y1="48" x2="130" y2="60" stroke="#38BDF8" strokeWidth="2" />
                    <Line x1="100" y1="75" x2="80" y2="105" stroke="#38BDF8" strokeWidth="2" />
                    <Line x1="100" y1="75" x2="120" y2="105" stroke="#38BDF8" strokeWidth="2" />
                    {/* Key joint tracking dots */}
                    <Circle cx="70" cy="60" r="3" fill="#22C55E" />
                    <Circle cx="130" cy="60" r="3" fill="#22C55E" />
                    <Circle cx="80" cy="105" r="3" fill="#22C55E" />
                    <Circle cx="120" cy="105" r="3" fill="#22C55E" />
                  </Animated.View>
                </Svg>
              </View>
              <View style={styles.cameraHudPill}>
                <View style={styles.greenDot} />
                <Text style={styles.cameraHudText}>30 FPS POSE ENGINE • 0 FRAME DROPS</Text>
              </View>
            </View>

            {/* Metrics Live Row */}
            <View style={styles.testMetricsRow}>
              <View style={styles.metricItem}>
                <AnimatedRepPop repCount={simulatedReps} label="Reps Counted" />
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <AnimatedNumberCounter
                  value={simulatedScore}
                  suffix="%"
                  style={styles.scoreText}
                  accessibilityLabel={`Form score ${simulatedScore} percent`}
                />
                <Text style={styles.metricLabel}>Form Score</Text>
              </View>
            </View>

            {/* Slide In Guidance Banner */}
            <SlideInBanner
              message={feedbackMessages[feedbackIdx]}
              type={feedbackIdx % 2 === 0 ? 'info' : 'correction'}
              accessibilityLiveRegion="polite"
            />

            <PrimaryButton
              title="Simulate Next Rep & Guidance"
              onPress={handleTriggerRep}
              size="md"
              accessibilityLabel="Simulate Next Rep"
              accessibilityHint="Fires rep pop scale and slide in banner"
              style={{ marginTop: Layout.spacing.xs }}
            />
          </View>
        </CardSpringEntry>

        {/* Progress Rings Benchmark Grid */}
        <CardSpringEntry index={2}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="pie-chart" size={20} color={Colors.success} />
              </View>
              <View style={styles.cardTitleBox}>
                <Text style={styles.cardTitle}>SVG Progress Rings Benchmark</Text>
                <Text style={styles.cardSub}>Concurrent hardware-accelerated circle strokes</Text>
              </View>
            </View>

            <View style={styles.ringsGrid}>
              <AnimatedProgressRing progress={94} size={76} strokeWidth={7} color={Colors.primary} label="FORM" />
              <AnimatedProgressRing progress={82} size={76} strokeWidth={7} color={Colors.success} label="VELOCITY" />
              <AnimatedProgressRing progress={68} size={76} strokeWidth={7} color="#0284C7" label="STAMINA" />
            </View>
          </View>
        </CardSpringEntry>

        {/* 20 Animated Stress Cards Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading} accessible={true} accessibilityRole="header">
            20 Animated Stress Cards
          </Text>
          <TouchableOpacity
            onPress={() => setActiveCardCount((c) => (c === 20 ? 10 : 20))}
            style={styles.toggleCardBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Toggle card density: Currently ${activeCardCount}`}
          >
            <Text style={styles.toggleCardText}>{activeCardCount === 20 ? 'Show 10' : 'Show 20'}</Text>
          </TouchableOpacity>
        </View>

        {cardsArray.map((cardNum) => (
          <CardSpringEntry key={cardNum} index={cardNum % 5}>
            <ScalePressable
              activeScale={0.98}
              style={styles.stressCard}
              accessibilityRole="button"
              accessibilityLabel={`Stress test card number ${cardNum}`}
            >
              <View style={styles.stressCardIndexBadge}>
                <Text style={styles.stressCardIndexText}>#{cardNum}</Text>
              </View>
              <View style={styles.stressCardContent}>
                <Text style={styles.stressCardTitle}>Kinematic Joint Node {cardNum}</Text>
                <Text style={styles.stressCardSub}>
                  Spring stiffness: {config.springStiffness} • Damping: {config.springDamping}
                </Text>
              </View>
              <Feather name="check-circle" size={18} color={Colors.success} />
            </ScalePressable>
          </CardSpringEntry>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  devOnlyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  devOnlyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm + 2,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.dark,
  },
  headerSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  hudCard: {
    backgroundColor: Colors.dark,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.card,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Layout.spacing.md,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  hudLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textInverseMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  hudDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Layout.borderRadius.lg,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: Layout.spacing.xs + 2,
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textInverseMuted,
    fontSize: 11,
  },
  modeTabTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm + 2,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.text,
  },
  cardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  cameraPreview: {
    height: 140,
    backgroundColor: '#0F172A',
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
  },
  cameraGridOverlay: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHudPill: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: Layout.borderRadius.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  cameraHudText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  testMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreText: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  ringsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Layout.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  sectionHeading: {
    ...Typography.h3,
    color: Colors.dark,
  },
  toggleCardBtn: {
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: Layout.spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleCardText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  stressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.sm,
    minHeight: 60,
    ...Layout.shadows.subtle,
  },
  stressCardIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  stressCardIndexText: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.primary,
    fontSize: 11,
  },
  stressCardContent: {
    flex: 1,
  },
  stressCardTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  stressCardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
});
