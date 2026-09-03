import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { NutritionTargets } from '../../types/domain';
import { ScalePressable } from '../animations/ScalePressable';

interface NutritionSnapshotCardProps {
  targets: NutritionTargets;
  onPress: () => void;
}

export const NutritionSnapshotCard: React.FC<NutritionSnapshotCardProps> = ({
  targets,
  onPress,
}) => {
  const consumed = targets.consumedCalories || 0;
  const total = targets.calories || 0;
  const remaining = total > 0 ? Math.max(0, total - consumed) : 0;
  const progressPercent = Math.min(100, Math.round((consumed / total) * 100));

  const protein = targets.proteinG || 0;
  const carbs = targets.carbsG || targets.carbohydratesG || 0;
  const fat = targets.fatG || 0;
  const fibre = targets.fibreG || 0;

  return (
    <ScalePressable
      activeScale={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Today's Nutrition Snapshot. ${consumed} of ${total} calories consumed. ${remaining} kcal remaining. Protein: ${protein}g, Carbs: ${carbs}g, Fat: ${fat}g, Fibre: ${fibre}g. Tap to open meal planner.`}
      accessibilityHint="Opens full daily meal logs and macronutrient targets"
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle} accessible={false} importantForAccessibility="no">
            <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.badgeText}>TODAY'S NUTRITION</Text>
            <Text style={styles.titleText}>
              <Text style={styles.consumedVal}>{consumed.toLocaleString()}</Text>
              <Text style={styles.totalVal}> / {total.toLocaleString()} kcal</Text>
            </Text>
          </View>
        </View>

        <View style={styles.remainingPill}>
          <Text style={styles.remainingPillText}>
            <Text style={styles.remainingBold}>{remaining.toLocaleString()}</Text> kcal left
          </Text>
          <Feather name="chevron-right" size={13} color={Colors.primary} style={{ marginLeft: 3 }} />
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack} accessible={false} importantForAccessibility="no">
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      {/* Macros Row: 145g Protein, 210g Carbs, 58g Fat, 28g Fibre */}
      <View style={styles.macrosRow}>
        <View style={styles.macroPill}>
          <Text style={[styles.macroVal, { color: '#2166BF' }]}>{protein}g</Text>
          <Text style={styles.macroLab}>Protein</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroPill}>
          <Text style={[styles.macroVal, { color: '#059669' }]}>{carbs}g</Text>
          <Text style={styles.macroLab}>Carbs</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroPill}>
          <Text style={[styles.macroVal, { color: '#D97706' }]}>{fat}g</Text>
          <Text style={styles.macroLab}>Fat</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroPill}>
          <Text style={[styles.macroVal, { color: '#7C3AED' }]}>{fibre}g</Text>
          <Text style={styles.macroLab}>Fibre</Text>
        </View>
      </View>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm + 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  titleText: {
    marginTop: 2,
  },
  consumedVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#040E34',
    letterSpacing: -0.5,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  remainingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  remainingPillText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  remainingBold: {
    fontWeight: '800',
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Layout.spacing.sm + 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  macroPill: {
    alignItems: 'center',
    flex: 1,
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  macroLab: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
});
