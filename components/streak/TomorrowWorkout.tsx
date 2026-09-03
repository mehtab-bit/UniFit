import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { PlanWorkoutItem } from '../../types/streak';

interface TomorrowWorkoutProps {
  workout: PlanWorkoutItem;
}

export const TomorrowWorkout: React.FC<TomorrowWorkoutProps> = ({ workout }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader} accessible={true} accessibilityRole="header">
          TOMORROW
        </Text>
        <View style={styles.plannedBadge}>
          <Text style={styles.plannedBadgeText}>Planned</Text>
        </View>
      </View>

      <View
        style={styles.card}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`Tomorrow's planned workout: ${workout.title}. ${workout.focus}. ${workout.meta}. Category: ${workout.category}.`}
      >
        <View style={styles.leftIconCircle}>
          <MaterialCommunityIcons name="shoe-sneaker" size={24} color="#D97706" />
        </View>
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.workoutTitle}>{workout.title}</Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{workout.category}</Text>
            </View>
          </View>
          <Text style={styles.workoutFocus}>{workout.meta || workout.focus}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    fontSize: 11,
  },
  plannedBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  plannedBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  leftIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  workoutTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text,
  },
  categoryPill: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Layout.borderRadius.sm,
  },
  categoryPillText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  workoutFocus: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
