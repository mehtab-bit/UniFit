import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useScreenAnnouncement } from '../hooks/useScreenAnnouncement';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { FeatureItem } from '../components/onboarding/FeatureItem';
import { UNIFIT_FEATURES } from '../constants/features';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Layout } from '../constants/layout';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeIntro } = useAuth();

  useScreenAnnouncement('Welcome to UniFit onboarding. Discover the core features.');

  const handleCompleteIntro = async () => {
    await completeIntro();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Top Header */}
        <View style={styles.topSection} accessible={true} accessibilityRole="header">
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/unifit-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel="UniFit logo"
            />
          </View>

          <Text style={styles.heading}>Welcome to UniFit</Text>
          <Text style={styles.subheading}>
            Your inclusive personalized fitness companion for a healthier, stronger, and better you.
          </Text>
        </View>

        {/* Key Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeaderRow} accessible={false} importantForAccessibility="no">
            <Text style={styles.sectionTitle}>UniFit-Key Features</Text>
            <View style={styles.featuresCountBadge}>
              <Text style={styles.featuresCountText}>6 Core Pillars</Text>
            </View>
          </View>

          {UNIFIT_FEATURES.map((feature, index) => (
            <FeatureItem
              key={feature.id}
              feature={feature}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Footer */}
      <View style={styles.footerContainer}>
        <PrimaryButton
          title="Get Started"
          onPress={handleCompleteIntro}
          accessibilityLabel="Next"
          accessibilityHint="Completes introduction tour and proceeds to the login screen"
          style={styles.primaryBtn}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCompleteIntro}
          style={styles.skipButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding intro"
          accessibilityHint="Bypasses feature tour and proceeds directly to login"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingTop: Layout.spacing.sm,
  },
  logoWrapper: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  logo: {
    width: 88,
    height: 88,
  },
  heading: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs + 4,
  },
  subheading: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Layout.spacing.sm,
  },
  featuresSection: {
    marginBottom: Layout.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xs,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  featuresCountBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs - 2,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.primaryMuted,
  },
  featuresCountText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  footerContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  primaryBtn: {
    marginBottom: Layout.spacing.sm,
  },
  skipButton: {
    paddingVertical: Layout.spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  skipText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
