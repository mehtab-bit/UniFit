import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { NutritionTargets } from '../../types/domain';
import { ScalePressable } from '../animations/ScalePressable';
import { ProgressRing } from '../ui/ProgressRing';

interface NutritionSnapshotCardProps {
  targets: NutritionTargets;
  onPress: () => void;
}

export const NutritionSnapshotCard: React.FC<NutritionSnapshotCardProps> = ({
  targets,
  onPress,
}) => {
  const consumed = targets.consumedCalories || 1940;
  const total = targets.calories || 2400;
  const remaining = targets.remainingCalories || 460;
  const progressPercent = Math.min(100, Math.round((consumed / total) * 100));

  const protein = targets.proteinG || 145;
  const carbs = targets.carbsG || targets.carbohydratesG || 210;
  const fat = targets.fatG || 58;
  const fibre = targets.fibreG || 28;

  return (
    <ScalePressable
      activeScale={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Today's Nutrition Snapshot. ${consumed} of ${total} calories consumed. ${remaining} kcal remaining. Protein: ${protein}g, Carbs: ${carbs}g, Fat: ${fat}g, Fibre: ${fibre}g. Tap to open meal planner.`}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.badgeText}>TODAY'S FUEL</Text>
          <Text style={styles.caloriesText}>{total.toLocaleString()} kcal</Text>
          <Text style={styles.subText}>{consumed.toLocaleString()} consumed</Text>
          <Text style={styles.subText}>{remaining.toLocaleString()} remaining</Text>
        </View>
        <View style={styles.topRight}>
          <ProgressRing progress={consumed / total} size={80} strokeWidth={8} color={Colors.primary}>
             <Text style={styles.ringText}>{progressPercent}%</Text>
          </ProgressRing>
        </View>
      </View>

      <View style={styles.macrosContainer}>
        <MacroBar label="Protein" value={protein} max={200} color="#2166BF" />
        <MacroBar label="Carbs" value={carbs} max={300} color="#059669" />
        <MacroBar label="Fat" value={fat} max={100} color="#D97706" />
        <MacroBar label="Fibre" value={fibre} max={40} color="#7C3AED" />
      </View>
    </ScalePressable>
  );
};

const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const width = Math.min(100, (value / max) * 100);
  return (
    <View style={styles.macroCol}>
      <Text style={styles.macroValue}>{value}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Layout.shadows.subtle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  topLeft: {
    flex: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  caloriesText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  topRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  macroTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 2,
  },
});
