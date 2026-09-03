import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../../common/PrimaryButton';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Layout } from '../../../constants/layout';

interface Step0IntroProps {
  userName?: string;
  onStart: () => void;
  onSkipAll: () => void;
}

export const Step0Intro: React.FC<Step0IntroProps> = ({
  userName = 'Athlete',
  onStart,
  onSkipAll,
}) => {
  const highlights = [
    {
      icon: 'target' as const,
      title: 'Targeted Progression',
      desc: 'Workouts calibrated to your specific fitness goals, schedule, and lifestyle.',
    },
    {
      icon: 'sliders' as const,
      title: 'Equipment & Nutrition Fit',
      desc: 'Matches exercises to your available gear and meals to your dietary preferences.',
    },
    {
      icon: 'shield' as const,
      title: 'Accessibility & Safety First',
      desc: 'Adaptive audio guidance, visual cues, and safety modifications for restrictions.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/unifit-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="UniFit Logo"
          />
          <Text style={styles.brandSubtitle}>UNIVERSAL FITNESS</Text>
        </View>

        {/* Hero Title & Greeting */}
        <View style={styles.heroSection}>
          <View style={styles.timeBadge}>
            <Feather name="clock" size={13} color={Colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.timeBadgeText}>12 Questions • Takes ~2 min</Text>
          </View>

          <Text style={styles.welcomeText}>Welcome, {userName}</Text>
          <Text style={styles.mainTitle}>Let's build your personalized plan</Text>
          <Text style={styles.subTitle}>
            We'll customize your training, nutrition, and accessibility preferences so UniFit works for you from day one.
          </Text>
        </View>

        {/* Highlights List */}
        <View style={styles.highlightsContainer}>
          {highlights.map((item, index) => (
            <View key={index} style={styles.highlightCard}>
              <View style={styles.iconCircle}>
                <Feather name={item.icon} size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Let's Get Started"
          onPress={onStart}
          accessibilityLabel="Let's Get Started with your plan"
          accessibilityHint="Starts question 1 of the personalized onboarding assessment"
          style={styles.startBtn}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSkipAll}
          style={styles.skipBtn}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Skip assessment for now"
          accessibilityHint="Bypasses assessment and navigates to the dashboard with standard settings"
        >
          <Text style={styles.skipBtnText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Layout.spacing.xs,
  },
  brandSubtitle: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    marginBottom: Layout.spacing.md,
  },
  timeBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  welcomeText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  mainTitle: {
    ...Typography.h1,
    color: Colors.dark,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subTitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.sm,
  },
  highlightsContainer: {
    width: '100%',
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  startBtn: {
    marginBottom: Layout.spacing.xs,
  },
  skipBtn: {
    paddingVertical: Layout.spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  skipBtnText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
