import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  AccessibilityInfo,
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

import { mealService, mealLogService } from '../../services';
import { MealLogEntry, MealPlan, Meal } from '../../types/domain';
import { Surface } from '../../context/SurfaceContext';

export default function FoodScreen() {
  const { user } = useAuth();
  useScreenAnnouncement('Nutrition and Meal Planner screen.');

  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<MealLogEntry[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logCustomName, setLogCustomName] = useState('');
  const [logCalories, setLogCalories] = useState('');
  const [logProtein, setLogProtein] = useState('');
  const [logCarbs, setLogCarbs] = useState('');
  const [logFat, setLogFat] = useState('');
  const [logFibre, setLogFibre] = useState('');
  const [logSaving, setLogSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMealData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const todayStr = new Date();
      const y = todayStr.getFullYear();
      const m = String(todayStr.getMonth() + 1).padStart(2, '0');
      const d = String(todayStr.getDate()).padStart(2, '0');
      const todayKey = `${y}-${m}-${d}`;
      const [plan, logs] = await Promise.all([
        mealService.getDailyMealPlan(user?.id),
        mealLogService.list(todayKey),
      ]);
      setMealPlan(plan);
      setLogEntries(logs);
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
  const known = (value?: number | null) => (value == null ? 0 : Number(value));
  const consumedCalories = logEntries.reduce(
    (sum, entry) => sum + known(entry.nutrition.calories_kcal),
    0
  );
  const consumedProtein = logEntries.reduce(
    (sum, entry) => sum + known(entry.nutrition.protein_g),
    0
  );
  const consumedCarbs = logEntries.reduce(
    (sum, entry) => sum + known(entry.nutrition.carbohydrates_g),
    0
  );
  const consumedFat = logEntries.reduce(
    (sum, entry) => sum + known(entry.nutrition.fat_g),
    0
  );
  const targetCalories = targets?.calories ?? 0;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const progressPercent =
    targetCalories > 0
      ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100))
      : 0;
  const proteinPct =
    (targets?.proteinG ?? 0) > 0
      ? Math.min(100, Math.round((consumedProtein / (targets?.proteinG || 1)) * 100))
      : 0;
  const carbsPct =
    ((targets?.carbohydratesG ?? targets?.carbsG) ?? 0) > 0
      ? Math.min(
          100,
          Math.round(
            (consumedCarbs /
              ((targets?.carbohydratesG ?? targets?.carbsG) || 1)) *
              100
          )
        )
      : 0;
  const fatPct =
    (targets?.fatG ?? 0) > 0
      ? Math.min(100, Math.round((consumedFat / (targets?.fatG || 1)) * 100))
      : 0;

  const logPlannedMeal = async (meal: Meal) => {
    try {
      await mealLogService.create({
        local_date: mealPlan?.date || '',
        meal_type: meal.mealType,
        source: 'planned_meal',
        plan_meal_id: meal.id,
        custom_name: meal.title,
        quantity: meal.servings || 1,
        quantity_unit: 'serving',
        nutrition: {
          calories_kcal: meal.calories,
          protein_g: meal.proteinG,
          carbohydrates_g: meal.carbohydratesG ?? meal.carbsG,
          fat_g: meal.fatG,
          fibre_g: meal.fibreG,
          carbohydrate_complete:
            meal.carbohydratesG != null || meal.carbsG != null,
          fiber_complete: meal.fibreG != null,
        },
      });
      setLogEntries(await mealLogService.list(mealPlan?.date));
      AccessibilityInfo.announceForAccessibility(`${meal.title} logged.`);
    } catch {
      Alert.alert('Could not log meal', 'Please check your connection and try again.');
    }
  };

  const saveCustomLog = async () => {
    const calories = Number(logCalories);
    if (!logCustomName.trim()) {
      Alert.alert('Food name required', 'Enter what you ate to continue.');
      return;
    }
    setLogSaving(true);
    try {
      await mealLogService.create({
        local_date: mealPlan?.date || '',
        source: 'custom',
        custom_name: logCustomName.trim(),
        quantity: 1,
        quantity_unit: 'serving',
        nutrition: {
          calories_kcal: Number.isFinite(calories) ? calories : null,
          protein_g: logProtein ? Number(logProtein) : null,
          carbohydrates_g: logCarbs ? Number(logCarbs) : null,
          fat_g: logFat ? Number(logFat) : null,
          fibre_g: logFibre ? Number(logFibre) : null,
          carbohydrate_complete: Boolean(logCarbs),
          fiber_complete: Boolean(logFibre),
        },
        notes: '',
      });
      setLogCustomName('');
      setLogCalories('');
      setLogProtein('');
      setLogCarbs('');
      setLogFat('');
      setLogFibre('');
      setShowLogModal(false);
      setLogEntries(await mealLogService.list(mealPlan?.date));
      AccessibilityInfo.announceForAccessibility('Custom food logged.');
    } catch {
      Alert.alert('Could not log food', 'Please check your connection and try again.');
    } finally {
      setLogSaving(false);
    }
  };

  const deleteLogEntry = async (entry: MealLogEntry) => {
    try {
      await mealLogService.remove(entry.id);
      setLogEntries(await mealLogService.list(mealPlan?.date));
    } catch {
      Alert.alert('Could not delete entry', 'Please try again.');
    }
  };

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
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowLogModal(true)}
                      style={styles.logFoodButton}
                    >
                      <Feather name="plus" size={14} color="#FFFFFF" />
                      <Text style={styles.logFoodButtonText}>Log Food</Text>
                    </Pressable>
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
                      <Text style={styles.macroRatio}>
                        {consumedProtein}/{targets?.proteinG ?? 0}g
                      </Text>
                    </View>
                    <View style={styles.macroTrack}>
                      <View style={[styles.macroFill, { width: `${proteinPct}%`, backgroundColor: '#00C8FF' }]} />
                    </View>
                  </View>

                  <View style={styles.macroProgressCol}>
                    <View style={styles.macroLabelRow}>
                      <Text style={styles.macroKey}>CARBS</Text>
                      <Text style={styles.macroRatio}>
                        {consumedCarbs}/{targets?.carbohydratesG ?? targets?.carbsG ?? 0}g
                      </Text>
                    </View>
                    <View style={styles.macroTrack}>
                      <View style={[styles.macroFill, { width: `${carbsPct}%`, backgroundColor: '#10B981' }]} />
                    </View>
                  </View>

                  <View style={styles.macroProgressCol}>
                    <View style={styles.macroLabelRow}>
                      <Text style={styles.macroKey}>FAT</Text>
                      <Text style={styles.macroRatio}>{consumedFat}/{targets?.fatG ?? 0}g</Text>
                    </View>
                    <View style={styles.macroTrack}>
                      <View style={[styles.macroFill, { width: `${fatPct}%`, backgroundColor: '#F59E0B' }]} />
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
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Log ${meal.title} as eaten`}
                              onPress={() => void logPlannedMeal(meal)}
                              style={styles.logThisMealButton}
                            >
                              <Feather name="check-circle" size={15} color="#FFFFFF" />
                              <Text style={styles.logThisMealText}>Log this meal</Text>
                            </Pressable>
                          </View>
                        )}
                      </ScalePressable>
                    </CardSpringEntry>
                  </View>
                </View>
              );
            })}
          </View>

          {logEntries.length > 0 ? (
            <View style={styles.logsSection}>
              <View style={styles.mealsHeaderRow}>
                <Text style={styles.sectionHeading}>LOG TODAY</Text>
              </View>
              {logEntries.map((entry) => (
                <View key={entry.id} style={styles.logRow}>
                  <View style={styles.logRowMain}>
                    <Text style={styles.logRowTitle} numberOfLines={1}>
                      {entry.custom_name || entry.plan_meal_id || 'Logged food'}
                    </Text>
                    <Text style={styles.logRowMeta}>
                      {entry.nutrition.calories_kcal != null
                        ? `${Math.round(entry.nutrition.calories_kcal)} kcal`
                        : 'Calories unknown'}
                      {entry.nutrition.protein_g != null
                        ? ` · ${Math.round(entry.nutrition.protein_g)}g protein`
                        : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${entry.custom_name || 'logged food'}`}
                    onPress={() => deleteLogEntry(entry)}
                    style={styles.deleteLogButton}
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </AsyncStateView>
      </ScrollView>

      {showLogModal ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log food</Text>
            <TextInput
              value={logCustomName}
              onChangeText={setLogCustomName}
              placeholder="Food name (e.g. Oats with banana)"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />
            <View style={styles.modalNumberRow}>
              <TextInput
                value={logCalories}
                onChangeText={setLogCalories}
                placeholder="Calories"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.modalInput, styles.modalNumberInput]}
              />
              <TextInput
                value={logProtein}
                onChangeText={setLogProtein}
                placeholder="Protein g"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.modalInput, styles.modalNumberInput]}
              />
            </View>
            <View style={styles.modalNumberRow}>
              <TextInput
                value={logCarbs}
                onChangeText={setLogCarbs}
                placeholder="Carbs g"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.modalInput, styles.modalNumberInput]}
              />
              <TextInput
                value={logFat}
                onChangeText={setLogFat}
                placeholder="Fat g"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={[styles.modalInput, styles.modalNumberInput]}
              />
            </View>
            <TextInput
              value={logFibre}
              onChangeText={setLogFibre}
              placeholder="Fibre g (optional)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowLogModal(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save custom food"
                onPress={saveCustomLog}
                disabled={logSaving}
                style={styles.modalSave}
              >
                <Text style={styles.modalSaveText}>
                  {logSaving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : null}
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
  logFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 14,
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  logFoodButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  logThisMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#0EA5E9',
    paddingVertical: 10,
    borderRadius: 12,
  },
  logThisMealText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  logsSection: { marginTop: 8, paddingBottom: 24 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  logRowMain: { flex: 1 },
  logRowTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  logRowMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  deleteLogButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 50,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
    minHeight: 44,
  },
  modalNumberRow: { flexDirection: 'row', gap: 10 },
  modalNumberInput: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { color: '#334155', fontWeight: '700' },
  modalSave: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
  },
  modalSaveText: { color: '#FFFFFF', fontWeight: '800' },
});
