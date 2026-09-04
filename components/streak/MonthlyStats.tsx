import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { StreakData } from '../../types/streak';
import { AnimatedNumberCounter } from '../animations/AnimatedNumberCounter';

interface MonthlyStatsProps {
  stats: StreakData;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ stats }) => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Monthly consistency is ${stats.consistency}%. Workouts: ${stats.monthlyWorkouts}, Completed: ${stats.monthlyCompleted}, Missed: ${stats.monthlyMissed}.`}
    >
      <View style={styles.consistencyHero}>
        <View style={styles.consistencyRow}>
          <AnimatedNumberCounter
            value={stats.consistency}
            style={styles.consistencyNumber}
            accessibilityLabel={`${stats.consistency}%`}
          />
          <Text style={styles.percentageSymbol}>%</Text>
        </View>
        <Text style={styles.consistencyLabel}>MONTHLY CONSISTENCY</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.monthlyWorkouts}</Text>
          <Text style={styles.statLabel}>PLANNED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#000000' }]}>{stats.monthlyCompleted}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.textMuted }]}>{stats.monthlyMissed}</Text>
          <Text style={styles.statLabel}>MISSED</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.subtle,
  },
  consistencyHero: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    marginTop: Layout.spacing.md,
  },
  consistencyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consistencyNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -2,
    lineHeight: 70,
  },
  percentageSymbol: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginTop: 8,
  },
  consistencyLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 2,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F4F5',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#D4D4D8',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3F3F46',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: 1,
    marginTop: 4,
  },
});
