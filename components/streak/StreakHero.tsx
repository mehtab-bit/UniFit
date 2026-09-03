import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { AnimatedNumberCounter } from '../animations/AnimatedNumberCounter';

interface StreakHeroProps {
  currentStreak: number;
  bestStreak: number;
  motivationalHeadline?: string;
  motivationalSubtext?: string;
}

export const StreakHero: React.FC<StreakHeroProps> = ({
  currentStreak,
  bestStreak,
  motivationalHeadline = "You're on a roll!",
  motivationalSubtext = 'Keep your momentum going.',
}) => {
  return (
    <View
      style={styles.heroCard}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${currentStreak} day streak. ${motivationalHeadline} ${motivationalSubtext} Best streak is ${bestStreak} days.`}
    >
      {/* Top Flame Graphic Container */}
      <View style={styles.flameBadge} accessible={false} importantForAccessibility="no">
        <MaterialCommunityIcons name="fire" size={44} color="#00C8FF" />
      </View>

      {/* Huge Streak Number */}
      <View style={styles.streakNumberRow}>
        <AnimatedNumberCounter
          value={currentStreak}
          style={styles.streakNumber}
          accessibilityLabel={`${currentStreak}`}
        />
      </View>
      <Text style={styles.streakTitle}>DAY STREAK</Text>

      {/* Motivational Headline & Subtext */}
      <Text style={styles.headline}>{motivationalHeadline}</Text>
      <Text style={styles.subtext}>{motivationalSubtext}</Text>

      {/* Best Streak Badge */}
      <View style={styles.bestStreakBadge}>
        <Feather name="award" size={15} color="#00C8FF" style={styles.awardIcon} />
        <Text style={styles.bestStreakLabel}>Best Streak: </Text>
        <Text style={styles.bestStreakValue}>{bestStreak} days</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#07328D',
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.card,
  },
  flameBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 200, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 200, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  streakNumberRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 60,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: Layout.spacing.sm,
  },
  headline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtext: {
    ...Typography.bodyMedium,
    color: '#CBD5E1',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: Layout.spacing.md,
  },
  bestStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Layout.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.25)',
  },
  awardIcon: {
    marginRight: 6,
  },
  bestStreakLabel: {
    color: '#9E9FA9',
    fontWeight: '600',
    fontSize: 12,
  },
  bestStreakValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});
