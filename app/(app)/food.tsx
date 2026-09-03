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
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AnimatedProgressRing } from '../../components/animations/AnimatedProgressRing';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { AsyncStateView } from '../../components/common/AsyncStateView';

import { mealService } from '../../services';
import { MealPlan } from '../../types/domain';
import { Surface } from '../../context/SurfaceContext';

export default function FoodScreen() {
  const { user } = useAuth();
  useScreenAnnouncement('Nutrition and Meal Planner screen.');

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <Text style={styles.headerSubtitle}>Fuel and macro tracking</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AsyncStateView loading={loading} error={error} onRetry={loadMealData}>
          
          <CardSpringEntry index={0}>
            <Surface type="dark">
              <View style={styles.fuelHeroCard}>
                <View style={styles.fuelHeroTopRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.fuelBadge}>TODAY'S FUEL</Text>
                    <Text style={styles.heroCalorieNumber}>
                      {targetCalories.toLocaleString()} <Text style={styles.heroCalorieUnit}>kcal</Text>
                    </Text>
                    <Text style={styles.heroCalorieSub}>
                      <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{consumedCalories.toLocaleString()}</Text> CONSUMED  /  <Text style={{ fontWeight: '800', color: '#00C8FF' }}>{remainingCalories.toLocaleString()}</Text> REMAINING
                    </Text>
                  </View>
                  <AnimatedProgressRing
                    progress={progressPercent}
                    size={100}
                    strokeWidth={8}
                    color="#00C8FF"
                    backgroundColor="#1E293B"
                    label="GOAL"
                    surface="dark"
                    textColor="#FFFFFF"
                    labelColor="#CBD5E1"
                  />
                </View>

                <View style={styles.macroProgressRow}>
                  <View style={styles.macroProgressCol}>
                    <View style={styles.macroLabelRow}>
                      <Text style={styles.macroKey}>PROTEIN</Text>
                      <Text style={styles.macroRatio}>{targets?.proteinG || 145}g</Text>
                    </View>
                    <View style={styles.macroTrack}>
                      <View style={[styles.macroFill, { width: '85%', backgroundColor: '#00C8FF' }]} />
                    </View>
                  </View>

                  <View style={styles.macroProgressCol}>
                    <View style={styles.macroLabelRow}>
                      <Text style={styles.macroKey}>CARBS</Text>
                      <Text style={styles.macroRatio}>{targets?.carbohydratesG || targets?.carbsG || 210}g</Text>
                    </View>
                    <View style={styles.macroTrack}>
                      <View style={[styles.macroFill, { width: '75%', backgroundColor: '#10B981' }]} />
                    </View>
                  </View>

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
            </Surface>
          </CardSpringEntry>

          <View style={styles.mealsHeaderRow}>
            <Text style={styles.sectionHeading}>MEAL TIMELINE</Text>
          </View>

          <View style={styles.timelineContainer}>
            {(mealPlan?.meals || []).map((meal, index) => {
              const isExpanded = expandedMealId === meal.id;
              const isLast = index === (mealPlan?.meals.length || 0) - 1;

              return (
                <View key={meal.id} style={styles.timelineRow}>
                  <View style={styles.timelineLineContainer}>
                    <View style={styles.timelineTimeBox}>
                      <Text style={styles.timelineTimeText}>{meal.time || '08:30'}</Text>
                    </View>
                    <View style={styles.timelineDot} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.timelineContent}>
                    <CardSpringEntry index={index + 2}>
                      <ScalePressable
                        activeScale={0.98}
                        onPress={() => toggleMealExpand(meal.id)}
                        style={styles.mealCard}
                      >
                        <View style={styles.mealTopRow}>
                          <View style={styles.mealHeaderLeft}>
                            <Text style={styles.mealCategoryLabel}>{meal.title.toUpperCase()}</Text>
                            <Text style={styles.mealDishName} numberOfLines={1}>{meal.items}</Text>
                          </View>
                          <View style={styles.mealHeaderRight}>
                            <Text style={styles.mealCalories}>{meal.caloriesFormatted}</Text>
                            <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" style={{ marginLeft: 8 }} />
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={styles.expandedSection}>
                            <View style={styles.expandedDivider} />
                            
                            <View style={styles.mealMacrosPillsRow}>
                              <View style={styles.mealMacroPill}>
                                <Text style={styles.mealMacroPillVal}>{meal.proteinG}g</Text>
                                <Text style={styles.mealMacroPillLab}>PRO</Text>
                              </View>
                              <View style={styles.mealMacroPill}>
                                <Text style={styles.mealMacroPillVal}>{meal.carbohydratesG || meal.carbsG || 0}g</Text>
                                <Text style={styles.mealMacroPillLab}>CARBS</Text>
                              </View>
                              <View style={styles.mealMacroPill}>
                                <Text style={styles.mealMacroPillVal}>{meal.fatG}g</Text>
                                <Text style={styles.mealMacroPillLab}>FAT</Text>
                              </View>
                            </View>

                            {meal.scaledIngredientQuantities && meal.scaledIngredientQuantities.length > 0 && (
                              <View style={styles.ingredientsContainer}>
                                {meal.scaledIngredientQuantities.map((item, iIdx) => (
                                  <View key={iIdx} style={styles.scaledRow}>
                                    <Text style={styles.scaledName}>{item.name}</Text>
                                    <Text style={styles.scaledAmount}>{item.amount}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {(meal.preparationNote || meal.prepNote) && (
                              <View style={styles.prepNoteContainer}>
                                <Text style={styles.prepNoteText}>{meal.preparationNote || meal.prepNote}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </ScalePressable>
                    </CardSpringEntry>
                  </View>
                </View>
              );
            })}
          </View>
        </AsyncStateView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '500' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  fuelHeroCard: {
    backgroundColor: '#0F172A', borderRadius: 24, padding: 24, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  fuelHeroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  fuelBadge: { fontSize: 11, fontWeight: '800', color: '#00C8FF', letterSpacing: 1.2, marginBottom: 8 },
  heroCalorieNumber: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5, lineHeight: 44 },
  heroCalorieUnit: { fontSize: 16, fontWeight: '600', color: '#CBD5E1', letterSpacing: 0 },
  heroCalorieSub: { fontSize: 11, color: '#CBD5E1', marginTop: 8, letterSpacing: 0.5 },
  macroProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#1E293B' },
  macroProgressCol: { flex: 1 },
  macroLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  macroKey: { fontSize: 10, fontWeight: '800', color: '#CBD5E1', letterSpacing: 1 },
  macroRatio: { fontSize: 11, fontWeight: '800', color: '#F8FAFC' },
  macroTrack: { height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 2 },
  mealsHeaderRow: { marginBottom: 24 },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: '#0F172A', letterSpacing: 1.5 },
  timelineContainer: { marginTop: 8 },
  timelineRow: { flexDirection: 'row' },
  timelineLineContainer: { width: 60, alignItems: 'center', position: 'relative' },
  timelineTimeBox: { marginBottom: 8 },
  timelineTimeText: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0EA5E9', borderWidth: 3, borderColor: '#E0F2FE', zIndex: 2 },
  timelineLine: { position: 'absolute', top: 28, bottom: -16, width: 2, backgroundColor: '#E2E8F0', zIndex: 1 },
  timelineContent: { flex: 1, paddingBottom: 24 },
  mealCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  mealTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mealHeaderLeft: { flex: 1, paddingRight: 16 },
  mealHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  mealCategoryLabel: { fontSize: 10, fontWeight: '800', color: '#0EA5E9', letterSpacing: 1.2, marginBottom: 4 },
  mealDishName: { fontSize: 15, fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  mealCalories: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  expandedSection: { marginTop: 16 },
  expandedDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  mealMacrosPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealMacroPill: { backgroundColor: '#F8FAFC', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  mealMacroPillVal: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  mealMacroPillLab: { fontSize: 9, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  ingredientsContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12 },
  scaledRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  scaledName: { fontSize: 13, color: '#334155', fontWeight: '500' },
  scaledAmount: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
  prepNoteContainer: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12 },
  prepNoteText: { fontSize: 13, color: '#334155', lineHeight: 18 },
});
