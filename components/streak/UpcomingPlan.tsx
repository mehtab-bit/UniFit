import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { PlanWorkoutItem } from '../../types/streak';

interface UpcomingPlanProps {
  items: PlanWorkoutItem[];
}

export const UpcomingPlan: React.FC<UpcomingPlanProps> = ({ items }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return <MaterialCommunityIcons name="dumbbell" size={18} color={Colors.primary} />;
      case 'endurance':
      case 'cycling':
        return <MaterialCommunityIcons name="bike" size={18} color="#059669" />;
      case 'cardio':
      case 'running':
        return <MaterialCommunityIcons name="run" size={18} color="#7C3AED" />;
      case 'recovery':
      case 'rest':
      default:
        return <Feather name="heart" size={16} color="#DC2626" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return '#EFF6FF';
      case 'endurance':
      case 'cycling':
        return '#DCFCE7';
      case 'cardio':
      case 'running':
        return '#F3E8FF';
      case 'recovery':
      case 'rest':
      default:
        return '#FFE4E6';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader} accessible={true} accessibilityRole="header">
        UP NEXT
      </Text>

      <View
        style={styles.cardList}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Upcoming workouts for the week"
      >
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              index < items.length - 1 && styles.itemRowBorder,
            ]}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${item.dayLabel}: ${item.title}. ${item.focus}. ${item.meta}.`}
          >
            {/* Day label badge */}
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{item.dayLabel}</Text>
            </View>

            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: getCategoryBg(item.category) }]}>
              {getCategoryIcon(item.category)}
            </View>

            {/* Details */}
            <View style={styles.detailsCol}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemFocus}>{item.meta || item.focus}</Text>
            </View>

            <Feather name="chevron-right" size={16} color={Colors.textSecondary} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.xl,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    fontSize: 11,
    marginBottom: Layout.spacing.sm,
  },
  cardList: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    paddingHorizontal: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayBadge: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  detailsCol: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 1,
  },
  itemFocus: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
