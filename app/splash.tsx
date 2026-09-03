import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Layout } from '../constants/layout';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, user, isOnboardingCompleted, isIntroSeen } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    // Smooth fade & scale in for the brand mark
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          if (isOnboardingCompleted) {
            router.replace('/(app)');
          } else {
            router.replace('/quiz');
          }
        } else {
          if (isIntroSeen) {
            router.replace('/(auth)/login');
          } else {
            router.replace('/onboarding');
          }
        }
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [isLoading, user, isOnboardingCompleted, isIntroSeen, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.navyDeep} />

      {/* Subtle geometric wave line background accent */}
      <View style={styles.backgroundGraphic} pointerEvents="none">
        <View style={styles.accentCircleOuter} />
        <View style={styles.accentCircleInner} />
        <View style={styles.accentWaveLine} />
      </View>

      {/* Center Brand Identity */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/unifit-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="UniFit Official Brand Logo"
          />
        </View>

        <View style={styles.taglineBlock}>
          <Text style={styles.primaryTagline}>UNIVERSAL FITNESS</Text>
          <Text style={styles.secondaryTagline}>FITNESS WITHOUT BARRIERS,</Text>
          <Text style={styles.secondaryTagline}>PROGRESS WITHOUT LIMITS</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Indicator */}
      <View style={styles.bottomSection}>
        <ActivityIndicator size="small" color={Colors.primaryLight} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading UniFit...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundGraphic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentCircleOuter: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.08)',
  },
  accentCircleInner: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.12)',
  },
  accentWaveLine: {
    position: 'absolute',
    bottom: '18%',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  logoContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logo: {
    width: 160,
    height: 160,
  },
  taglineBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTagline: {
    ...Typography.brandPrimary,
    color: Colors.primaryLight,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: Layout.spacing.xs + 2,
  },
  secondaryTagline: {
    ...Typography.brandSecondary,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
  },
  bottomSection: {
    position: 'absolute',
    bottom: Layout.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: Layout.spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
