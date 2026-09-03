import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
      accessibilityLabel={`This month: ${stats.monthlyWorkouts} total workouts, ${stats.monthlyCompleted} completed, ${stats.monthlyMissed} missed, with ${stats.consistency}% consistency.`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>THIS MONTH</Text>
        <View style={styles.consistencyBadge}>
          <Feather name="trending-up" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.consistencyBadgeText}>{stats.consistency}% Consistency</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {/* Workouts Target */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            <AnimatedNumberCounter value={stats.monthlyWorkouts} style={styles.statValueText} accessibilityLabel={`${stats.monthlyWorkouts}`} />
          </Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>

        {/* Completed */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            <AnimatedNumberCounter
              value={stats.monthlyCompleted}
              style={[styles.statValueText, { color: Colors.primary }]}
              accessibilityLabel={`${stats.monthlyCompleted}`}
            />
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        {/* Missed */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            <AnimatedNumberCounter
              value={stats.monthlyMissed}
              style={[styles.statValueText, { color: Colors.textMuted }]}
              accessibilityLabel={`${stats.monthlyMissed}`}
            />
          </Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>

        {/* Consistency */}
        <View style={[styles.statCard, styles.statCardHighlight]}>
          <Text style={styles.statValue}>
            <AnimatedNumberCounter
              value={stats.consistency}
              style={[styles.statValueText, { color: Colors.primary }]}
              accessibilityLabel={`${stats.consistency}%`}
            />
            <Text style={styles.percentageSymbol}>%</Text>
          </Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    fontSize: 11,
  },
  consistencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  consistencyBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Layout.spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardHighlight: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  statValueText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  percentageSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
