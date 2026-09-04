import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}) => {
  return (
    <View
      style={styles.heroCard}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${currentStreak} day streak. Best streak is ${bestStreak} days.`}
    >
      <View style={styles.streakRow}>
        <AnimatedNumberCounter
          value={currentStreak}
          surface="dark"
          style={styles.streakNumber}
          accessibilityLabel={`${currentStreak}`}
        />
        <Text style={styles.streakTitle}> DAY STREAK</Text>
      </View>
      <View style={styles.bestStreakRow}>
        <Text style={styles.bestStreakText}>Best {bestStreak} days</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#000000',
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.xxl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.card,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -3,
    lineHeight: 80,
  },
  streakTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginLeft: 8,
  },
  bestStreakRow: {
    marginTop: Layout.spacing.sm,
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Layout.borderRadius.full,
  },
  bestStreakText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

