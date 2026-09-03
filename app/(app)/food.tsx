import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AnimatedProgressRing } from '../../components/animations/AnimatedProgressRing';
import { AnimatedNumberCounter } from '../../components/animations/AnimatedNumberCounter';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Services & Domain Models
import { mealService } from '../../services';
import { MealPlan, Meal } from '../../types/domain';

export default function FoodScreen() {
  const { user } = useAuth();
  useScreenAnnouncement('Nutrition and Meal Planner screen. View daily caloric budget, macronutrient targets, and 4 scheduled meals.');

  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMealData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const plan = await mealService.getDailyMealPlan(user?.id);
      setMealPlan(plan);
    } catch (err) {
      setError('Unable to load nutrition and meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMealData();
  }, [loadMealData]);

  const targets = mealPlan?.targets;
  const consumedCalories = targets?.consumedCalories || 1940;
  const targetCalories = targets?.calories || 2400;
  const remainingCalories = targets?.remainingCalories || Math.max(0, targetCalories - consumedCalories);
  const progressPercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100));

  const toggleMealExpand = (id: string) => {
    setExpandedMealId((prev) => (prev === id ? null : id));
  };

  const getMealIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee':
        return <Feather name="coffee" size={20} color={Colors.primary} />;
      case 'sun':
        return <Feather name="sun" size={20} color="#D97706" />;
      case 'smile':
        return <Feather name="smile" size={20} color="#059669" />;
      case 'moon':
      default:
        return <Feather name="moon" size={20} color="#7C3AED" />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <Text style={styles.headerTitle}>Nutrition & Fuel</Text>
        <Text style={styles.headerSubtitle}>Daily caloric budget and macronutrient breakdown</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadMealData}>
          {/* Unified Daily Fuel Hero Card */}
          <CardSpringEntry index={0}>
            <View
              style={styles.fuelHeroCard}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Daily Caloric Goal: ${targetCalories} kcal. ${consumedCalories} consumed. ${remainingCalories} remaining.`}
            >
              {/* Top Row: Title & Calorie Ring */}
              <View style={styles.fuelHeroTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.fuelBadge}>TODAY'S FUEL TARGET</Text>
                  <Text style={styles.heroCalorieNumber}>
                    {targetCalories.toLocaleString()} <Text style={styles.heroCalorieUnit}>kcal</Text>
                  </Text>
                  <Text style={styles.heroCalorieSub}>
                    <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{consumedCalories.toLocaleString()}</Text> consumed •{' '}
                    <Text style={{ fontWeight: '700', color: '#00C8FF' }}>{remainingCalories.toLocaleString()}</Text> remaining
                  </Text>
                </View>

                <AnimatedProgressRing
                  progress={progressPercent}
                  size={90}
                  strokeWidth={8}
                  color="#00C8FF"
                  backgroundColor="#07328D"
                  label="GOAL"
                />
              </View>

              {/* Compact Visual Macro Bars */}
              <View style={styles.macroProgressRow}>
                {/* Protein */}
                <View style={styles.macroProgressCol}>
                  <View style={styles.macroLabelRow}>
                    <Text style={styles.macroKey}>PROTEIN</Text>
                    <Text style={styles.macroRatio}>{targets?.proteinG || 145}g</Text>
                  </View>
                  <View style={styles.macroTrack}>
                    <View style={[styles.macroFill, { width: '85%', backgroundColor: '#00C8FF' }]} />
                  </View>
                </View>

                {/* Carbs */}
                <View style={styles.macroProgressCol}>
                  <View style={styles.macroLabelRow}>
                    <Text style={styles.macroKey}>CARBS</Text>
                    <Text style={styles.macroRatio}>{targets?.carbohydratesG || targets?.carbsG || 210}g</Text>
                  </View>
                  <View style={styles.macroTrack}>
                    <View style={[styles.macroFill, { width: '75%', backgroundColor: '#10B981' }]} />
                  </View>
                </View>

                {/* Fat */}
                <View style={styles.macroProgressCol}>
                  <View style={styles.macroLabelRow}>
                    <Text style={styles.macroKey}>FAT</Text>
                    <Text style={styles.macroRatio}>{targets?.fatG || 58}g</Text>
                  </View>
                  <View style={styles.macroTrack}>
                    <View style={[styles.macroFill, { width: '65%', backgroundColor: '#F59E0B' }]} />
                  </View>
                </View>
              </View>
            </View>
          </CardSpringEntry>

          {/* Scheduled Meals List (Breakfast, Lunch, Evening Snack, Dinner) */}
          <View style={styles.mealsHeaderRow} accessible={true} accessibilityRole="header">
            <Text style={styles.sectionHeading}>TODAY'S MEALS</Text>
            <Text style={styles.sectionSubHeading}>4 nutrient-dense fuel allocations</Text>
          </View>

          {(mealPlan?.meals || []).map((meal, index) => {
            const isExpanded = expandedMealId === meal.id;

            return (
              <CardSpringEntry key={meal.id} index={index + 2}>
                <ScalePressable
                  activeScale={0.98}
                  onPress={() => toggleMealExpand(meal.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${meal.title} at ${meal.time}. ${meal.caloriesFormatted}. ${meal.servingLabel}. Protein: ${meal.proteinG}g, Carbs: ${meal.carbohydratesG || meal.carbsG || 0}g, Fat: ${meal.fatG}g, Fibre: ${meal.fibreG || 0}g. ${meal.items}. Double tap to ${isExpanded ? 'collapse' : 'view ingredients and preparation'}.`}
                  accessibilityHint="Expands scaled ingredients, preparation notes, and macro breakdown"
                  style={styles.mealCard}
                >
                  <View style={styles.mealTopRow}>
                    <View style={styles.mealIconBox}>
                      {getMealIcon(meal.icon)}
                    </View>

                    <View style={styles.mealInfo}>
                      <View style={styles.mealTitleRow}>
                        <Text style={styles.mealCategoryLabel}>{meal.title.toUpperCase()}</Text>
                        <Text style={styles.mealCalories}>{meal.caloriesFormatted}</Text>
                      </View>
                      <Text style={styles.mealDishName} numberOfLines={1}>{meal.items}</Text>
                      <Text style={styles.mealSubMeta}>
                        {meal.time} • {meal.proteinG}g Protein
                      </Text>
                    </View>

                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </View>

                  {/* Expanded Scaled Ingredients, Preparation, and Macro Breakdown */}
                  {isExpanded ? (
                    <View style={styles.expandedSection}>
                      <View style={styles.expandedDivider} />

                      {/* Serving Portion */}
                      <View style={styles.portionBadge}>
                        <Feather name="user" size={12} color={Colors.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.portionText}>
                          Portion: {meal.servingLabel || `${meal.servings} serving`}
                        </Text>
                      </View>

                      {/* Macro Pill Specs (Revealed on Expand) */}
                      <View style={styles.mealMacrosPillsRow}>
                        <View style={styles.mealMacroPill}>
                          <Text style={[styles.mealMacroPillVal, { color: '#2563EB' }]}>{meal.proteinG}g</Text>
                          <Text style={styles.mealMacroPillLab}>Protein</Text>
                        </View>
                        <View style={styles.mealMacroPill}>
                          <Text style={[styles.mealMacroPillVal, { color: '#059669' }]}>
                            {meal.carbohydratesG !== undefined && meal.carbohydratesG !== null
                              ? `${meal.carbohydratesG}g`
                              : meal.carbsG !== undefined && meal.carbsG !== null
                              ? `${meal.carbsG}g`
                              : 'Not reported'}
                          </Text>
                          <Text style={styles.mealMacroPillLab}>Carbs</Text>
                        </View>
                        <View style={styles.mealMacroPill}>
                          <Text style={[styles.mealMacroPillVal, { color: '#D97706' }]}>{meal.fatG}g</Text>
                          <Text style={styles.mealMacroPillLab}>Fat</Text>
                        </View>
                        <View style={styles.mealMacroPill}>
                          <Text style={[styles.mealMacroPillVal, { color: '#7C3AED' }]}>
                            {meal.fibreG !== undefined && meal.fibreG !== null
                              ? `${meal.fibreG}g`
                              : 'Not reported'}
                          </Text>
                          <Text style={styles.mealMacroPillLab}>Fibre</Text>
                        </View>
                      </View>

                      {/* Scaled Ingredients with Quantities */}
                      {meal.scaledIngredientQuantities && meal.scaledIngredientQuantities.length > 0 ? (
                        <View style={styles.ingredientsContainer}>
                          <Text style={styles.ingredientsHeading}>SCALED INGREDIENTS</Text>
                          <View style={styles.scaledList}>
                            {meal.scaledIngredientQuantities.map((item, iIdx) => (
                              <View key={iIdx} style={styles.scaledRow}>
                                <Text style={styles.scaledName}>{item.name}</Text>
                                <Text style={styles.scaledAmount}>{item.amount}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}

                      {/* Preparation Note */}
                      {meal.preparationNote || meal.prepNote ? (
                        <View style={styles.prepNoteContainer}>
                          <Feather name="book-open" size={13} color={Colors.primary} style={{ marginRight: 6, marginTop: 2 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.prepNoteHeading}>PREPARATION NOTE</Text>
                            <Text style={styles.prepNoteText}>
                              {meal.preparationNote || meal.prepNote}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </ScalePressable>
              </CardSpringEntry>
            );
          })}
        </AsyncStateView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.text,
  },
  cardSub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Layout.spacing.md,
  },
  calorieStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieStatItem: {
    alignItems: 'flex-start',
  },
  calorieStatValue: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.text,
  },
  calorieStatLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.md,
  },
  fuelHeroCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#07328D',
    ...Layout.shadows.card,
  },
  fuelHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fuelBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroCalorieNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroCalorieUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9E9FA9',
    letterSpacing: 0,
  },
  heroCalorieSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  macroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  macroProgressCol: {
    flex: 1,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroKey: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E9FA9',
    letterSpacing: 0.8,
  },
  macroRatio: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  mealsHeaderRow: {
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  sectionHeading: {
    ...Typography.h3,
    color: Colors.dark,
  },
  sectionSubHeading: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  mealCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  mealTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealIconBox: {
    width: 42,
    height: 42,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  mealInfo: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mealTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text,
  },
  mealCategoryLabel: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.primary,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  mealCalories: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.text,
    fontSize: 12,
  },
  mealDishName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 1,
  },
  mealSubMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  portionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  portionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  mealMacrosPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: Layout.spacing.sm,
  },
  mealMacroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealMacroPillVal: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 3,
  },
  mealMacroPillLab: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ingredientsContainer: {
    marginBottom: 8,
  },
  ingredientsHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  scaledList: {
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scaledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scaledName: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  scaledAmount: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  prepNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  prepNoteHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  prepNoteText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.dark,
    lineHeight: 16,
  },
});
