import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../animations/ScalePressable';
import { AnimatedNumberCounter } from '../animations/AnimatedNumberCounter';

interface StreakSummaryProps {
  currentStreak: number;
  bestStreak?: number;
  onPress: () => void;
  subtext?: string;
}

export const StreakSummary: React.FC<StreakSummaryProps> = ({
  currentStreak,
  bestStreak = 0,
  onPress,
}) => {
  return (
    <ScalePressable
      activeScale={0.96}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${currentStreak} day streak. Best streak ${bestStreak} days. Double tap to view streak and monthly plan.`}
      accessibilityHint="Opens your dedicated Streak and Monthly Plan dashboard"
      style={styles.compactWidget}
    >
      {/* Top Flame Icon + Large Hero Number */}
      <View style={styles.topRow}>
        <View style={styles.iconCircle} accessible={false} importantForAccessibility="no">
          <MaterialCommunityIcons name="fire" size={18} color="#00C8FF" />
        </View>
        <AnimatedNumberCounter
          value={currentStreak}
          style={styles.heroNumber}
          accessibilityLabel={`${currentStreak}`}
        />
      </View>

      {/* Label: DAY STREAK */}
      <Text style={styles.streakLabel}>DAY STREAK</Text>

      {/* Small Metadata: Best 12 days */}
      <Text style={styles.bestMeta}>Best {bestStreak} days</Text>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  compactWidget: {
    backgroundColor: '#001554',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#07328D',
    minWidth: 104,
    maxWidth: 126,
    ...Layout.shadows.subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 200, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.25)',
  },
  heroNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  streakLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  bestMeta: {
    fontSize: 9,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 2,
  },
});
