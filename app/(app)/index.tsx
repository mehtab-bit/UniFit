import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { HomeTodayWorkoutCard } from '../../components/workout/HomeTodayWorkoutCard';
import { NutritionSnapshotCard } from '../../components/nutrition/NutritionSnapshotCard';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Services & Domain Models
import {
  workoutService,
  streakService,
  nutritionService,
  workoutNoteService,
} from '../../services';
import {
  WorkoutPlan,
  WorkoutDay,
  StreakData,
  NutritionTargets,
  WorkoutNote,
} from '../../types/domain';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Screen announcement for screen readers
  useScreenAnnouncement(
    "Home screen. Good morning! Here's your weekly fitness plan and daily targets."
  );

  // Get user's first name from authenticated context
  const firstName = user?.fullName
    ? user.fullName.trim().split(' ')[0]
    : profile?.full_name
    ? profile.full_name.trim().split(' ')[0]
    : 'Athlete';

  // Async Service State
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // Note State
  const [userNote, setUserNote] = useState<WorkoutNote | null>(null);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteInputText, setNoteInputText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [planResult, todayResult, streakResult, nutritionResult] = await Promise.all([
        workoutService.getWeeklyPlan(user?.id),
        workoutService.getTodayWorkout(user?.id),
        streakService.getStreakData(user?.id),
        nutritionService.getDailyTargets(user?.id),
      ]);
      setWeeklyPlan(planResult);
      setTodayWorkout(todayResult);
      setStreakData(streakResult);
      setNutritionTargets(nutritionResult);

      if (planResult?.days && !selectedDayId) {
        const today = planResult.days.find((d) => d.status === 'today');
        if (today) setSelectedDayId(today.id);
        else setSelectedDayId(planResult.days[0].id);
      }

      // Load user note for today
      const targetDate = todayResult?.date || '2026-09-21';
      const existingNote = await workoutNoteService.getNote(targetDate, user?.id);
      setUserNote(existingNote);
    } catch {
      setError('Unable to load fitness dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedDayId]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const handleOpenStreakPlan = () => {
    router.push('/(app)/streak-plan');
  };

  const handleStartWorkout = (workoutDay?: WorkoutDay) => {
    const target = workoutDay || todayWorkout;
    if (target?.date) {
      router.push({
        pathname: '/(app)/workout',
        params: { date: target.date, dayId: target.id },
      });
    } else {
      router.push('/(app)/workout');
    }
  };

  const handleOpenFood = () => {
    router.push('/(app)/food');
  };

  // Note Handlers
  const handleOpenNoteModal = (initialText = '') => {
    setNoteInputText(initialText || userNote?.note || '');
    setIsNoteModalVisible(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalVisible(false);
  };

  const handleSaveNote = async () => {
    if (!noteInputText.trim()) return;
    try {
      setIsSavingNote(true);
      const targetDate = todayWorkout?.date || '2026-09-21';
      const saved = await workoutNoteService.saveNote(targetDate, noteInputText.trim(), user?.id);
      setUserNote(saved);
      setIsNoteModalVisible(false);
    } catch {
      // Handled
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      const targetDate = todayWorkout?.date || '2026-09-21';
      await workoutNoteService.deleteNote(targetDate, user?.id);
      setUserNote(null);
    } catch {
      // Handled
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Top Header: UniFit Logo (Left) and Profile Avatar (Right) */}
      <View style={styles.topHeader} accessible={true} accessibilityRole="header">
        <View style={styles.headerBrandLeft}>
          <Image
            source={require('../../assets/images/unifit-logo.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel="UniFit Logo"
          />
          <View style={styles.headerBrandTextCol}>
            <Text style={styles.headerBrandTitle}>UniFit</Text>
            <Text style={styles.headerBrandSub}>UNIVERSAL FITNESS</Text>
          </View>
        </View>

        <ScalePressable
          onPress={() => router.push('/(app)/profile')}
          accessibilityRole="button"
          accessibilityLabel={`Profile of ${firstName}. Tap to open profile settings.`}
          accessibilityHint="Navigates to your profile and fitness settings"
          style={styles.avatarButton}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </ScalePressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadHomeData}>
          {/* Greeting & Compact Streak Widget */}
          <CardSpringEntry index={0}>
            <View style={styles.greetingHeaderRow}>
              <View style={styles.greetingTextCol}>
                <Text style={styles.greetingTitle}>Good morning, {firstName}</Text>
              </View>

              <ScalePressable
                onPress={handleOpenStreakPlan}
                accessibilityRole="button"
                accessibilityLabel={`Current streak: ${streakData?.currentStreak || 5} days. Best streak: ${streakData?.bestStreak || 12} days.`}
                style={styles.streakWidget}
              >
                <MaterialCommunityIcons name="fire" size={18} color="#EA580C" style={{ marginRight: 6 }} />
                <Text style={styles.streakNum}>{streakData?.currentStreak || 5}</Text>
                <View style={styles.streakCol}>
                  <Text style={styles.streakLabel}>DAY STREAK</Text>
                  <Text style={styles.streakBest}>Best {streakData?.bestStreak || 12}</Text>
                </View>
              </ScalePressable>
            </View>
          </CardSpringEntry>

          {/* Today's Workout Hero Card */}
          {todayWorkout ? (
            <CardSpringEntry index={1}>
              <HomeTodayWorkoutCard
                workout={todayWorkout}
                onStartWorkout={() => handleStartWorkout(todayWorkout)}
                onViewPlan={handleOpenStreakPlan}
              />
            </CardSpringEntry>
          ) : null}

          {/* Nutrition Snapshot Card */}
          {nutritionTargets ? (
            <CardSpringEntry index={2}>
              <NutritionSnapshotCard
                targets={nutritionTargets}
                onPress={handleOpenFood}
              />
            </CardSpringEntry>
          ) : null}

          {/* Weekly Plan Header */}
          <View style={styles.weeklyHeaderRow} accessible={true} accessibilityRole="header">
            <Text style={styles.weeklyHeaderTitle}>THIS WEEK'S PLAN</Text>
            <ScalePressable
              onPress={handleOpenStreakPlan}
              accessibilityRole="button"
              accessibilityLabel="View full schedule on Streak and Plan"
              style={styles.viewScheduleLink}
            >
              <Text style={styles.viewScheduleLinkText}>Full Calendar</Text>
              <Feather name="chevron-right" size={13} color={Colors.primary} />
            </ScalePressable>
          </View>

          {/* Redesigned Premium Weekly Fitness Selector */}
          <CardSpringEntry index={3}>
            <View style={styles.weekRhythmContainer}>
              {(weeklyPlan?.days || []).map((item) => {
                const isSelected = item.id === selectedDayId;
                const isToday = item.status === 'today';
                const isRest = item.category?.toLowerCase() === 'rest' || item.activity === 'rest';
                const isCompleted = item.status === 'completed';
                const isMissed = item.status === 'missed';

                return (
                  <ScalePressable
                    key={item.id}
                    onPress={() => setSelectedDayId(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.dayOfWeek} ${item.dayNumber}. ${item.title}. ${isToday ? 'Today.' : ''} ${isRest ? 'Rest Day.' : isCompleted ? 'Completed.' : 'Planned.'} ${isSelected ? 'Selected.' : ''}`}
                    style={[
                      styles.dayChip,
                      isToday && styles.dayChipToday,
                      isSelected && styles.dayChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayAbbr,
                        isToday && styles.dayAbbrToday,
                        isSelected && styles.dayAbbrSelected,
                      ]}
                    >
                      {item.dayOfWeek}
                    </Text>

                    <Text
                      style={[
                        styles.dayDateNumber,
                        isToday && styles.dayDateNumberToday,
                        isSelected && styles.dayDateNumberSelected,
                      ]}
                    >
                      {item.dayNumber}
                    </Text>

                    <View style={styles.dayStatusIndicator}>
                      {isCompleted ? (
                        <Feather name="check" size={11} color={isSelected ? '#FFFFFF' : '#10B981'} />
                      ) : isMissed ? (
                        <Feather name="alert-circle" size={11} color={isSelected ? '#FFFFFF' : '#EF4444'} />
                      ) : isRest ? (
                        <View style={[styles.restBar, isSelected && styles.restBarSelected]} />
                      ) : (
                        <View
                          style={[
                            styles.plannedDot,
                            isToday && styles.plannedDotToday,
                            isSelected && styles.plannedDotSelected,
                          ]}
                        />
                      )}
                    </View>
                  </ScalePressable>
                );
              })}
            </View>
          </CardSpringEntry>

          {/* Selected Day Workout Focus Card */}
          {(() => {
            const selectedItem = (weeklyPlan?.days || []).find((d) => d.id === selectedDayId);
            if (!selectedItem) return null;

            const isRest = selectedItem.category?.toLowerCase() === 'rest' || selectedItem.activity === 'rest';
            const isToday = selectedItem.status === 'today';
            const isCompleted = selectedItem.status === 'completed';

            const metaText = isRest
              ? 'RECOVERY & MOBILITY'
              : selectedItem.meta
              ? selectedItem.meta.toUpperCase()
              : `${selectedItem.durationMinutes || 25} MIN · ${(selectedItem.exercises?.length || 5)} EXERCISES`;

            return (
              <CardSpringEntry index={4}>
                <View style={styles.selectedDayCard}>
                  <View style={styles.selectedDayHeaderBadgeRow}>
                    <Text style={styles.selectedDayHeaderBadge}>
                      {selectedItem.dayOfWeek} {selectedItem.dayNumber} · {isToday ? 'TODAY' : isRest ? 'REST' : isCompleted ? 'COMPLETED' : 'PLANNED'}
                    </Text>
                  </View>

                  <Text style={styles.selectedDayWorkoutTitle}>
                    {selectedItem.title.toUpperCase()}
                  </Text>
                  <Text style={styles.selectedDayWorkoutMeta}>{metaText}</Text>

                  {!isRest ? (
                    <ScalePressable
                      onPress={() => handleStartWorkout(selectedItem)}
                      accessibilityRole="button"
                      accessibilityLabel={`Start session: ${selectedItem.title}`}
                      style={styles.selectedDayCta}
                    >
                      <Text style={styles.selectedDayCtaText}>START SESSION</Text>
                      <Feather name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </ScalePressable>
                  ) : (
                    <View style={styles.restDayNoticeBox}>
                      <Feather name="coffee" size={16} color="#78350F" style={{ marginRight: 8 }} />
                      <Text style={styles.restDayNoticeText}>
                        Rest and muscle recovery day. No active workout scheduled.
                      </Text>
                    </View>
                  )}
                </View>
              </CardSpringEntry>
            );
          })()}

          {/* Functional Workout Reflection / Note Section */}
          <CardSpringEntry index={5}>
            <View
              style={styles.feedbackCard}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={
                userNote
                  ? `Your workout note: ${userNote.note}`
                  : 'How was your workout today? Share your experience and help us improve your plan.'
              }
            >
              {userNote ? (
                <View>
                  <View style={styles.savedNoteHeaderRow}>
                    <View style={styles.savedNoteBadge}>
                      <MaterialCommunityIcons name="note-text-outline" size={15} color="#D97706" style={{ marginRight: 6 }} />
                      <Text style={styles.savedNoteBadgeText}>YOUR NOTE</Text>
                    </View>
                    <Text style={styles.savedNoteDate}>TODAY</Text>
                  </View>

                  <Text style={styles.savedNoteQuote}>"{userNote.note}"</Text>

                  <View style={styles.savedNoteActionsRow}>
                    <ScalePressable
                      onPress={() => handleOpenNoteModal(userNote.note)}
                      accessibilityRole="button"
                      accessibilityLabel="Edit workout note"
                      accessibilityHint="Opens editor to modify your saved note"
                      style={styles.editNoteBtn}
                    >
                      <Feather name="edit-2" size={13} color="#78350F" style={{ marginRight: 5 }} />
                      <Text style={styles.editNoteBtnText}>Edit Note</Text>
                    </ScalePressable>

                    <ScalePressable
                      onPress={handleDeleteNote}
                      accessibilityRole="button"
                      accessibilityLabel="Delete workout note"
                      accessibilityHint="Removes your note for today"
                      style={styles.deleteNoteBtn}
                    >
                      <Feather name="trash-2" size={13} color="#DC2626" style={{ marginRight: 5 }} />
                      <Text style={styles.deleteNoteBtnText}>Delete</Text>
                    </ScalePressable>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.feedbackLeft}>
                    <View style={styles.feedbackIconCircle}>
                      <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color="#D97706" />
                    </View>
                    <View style={styles.feedbackTextCol}>
                      <Text style={styles.feedbackTitle}>How was your workout today?</Text>
                      <Text style={styles.feedbackSub}>
                        Share your experience and help us improve your plan.
                      </Text>
                    </View>
                  </View>

                  <ScalePressable
                    activeScale={0.96}
                    onPress={() => handleOpenNoteModal('')}
                    accessibilityRole="button"
                    accessibilityLabel="Leave a Note"
                    accessibilityHint="Opens workout reflection modal"
                    style={styles.leaveNoteButton}
                  >
                    <Text style={styles.leaveNoteText}>Leave a Note</Text>
                    <Feather name="chevron-right" size={14} color="#78350F" style={{ marginLeft: 2 }} />
                  </ScalePressable>
                </View>
              )}
            </View>
          </CardSpringEntry>
        </AsyncStateView>
      </ScrollView>

      {/* Workout Note Modal */}
      <Modal
        visible={isNoteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseNoteModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseNoteModal} />
          <View
            style={styles.modalContentCard}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="Workout reflection note modal"
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconWrap}>
                <MaterialCommunityIcons name="clipboard-edit-outline" size={22} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>How was your workout?</Text>
                <Text style={styles.modalSubtitle}>
                  Add anything you want to remember about today's session.
                </Text>
              </View>
            </View>

            <TextInput
              style={styles.modalTextInput}
              placeholder="How did you feel? Any pain, difficulty, energy levels, or anything you want to remember..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={noteInputText}
              onChangeText={setNoteInputText}
              textAlignVertical="top"
              autoFocus
              accessible={true}
              accessibilityLabel="Workout reflection note"
              accessibilityHint="Type your notes about energy, difficulty, or form here"
            />

            <View style={styles.modalActionsRow}>
              <ScalePressable
                onPress={handleCloseNoteModal}
                accessibilityRole="button"
                accessibilityLabel="Cancel note"
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </ScalePressable>

              <ScalePressable
                onPress={handleSaveNote}
                disabled={!noteInputText.trim() || isSavingNote}
                accessibilityRole="button"
                accessibilityLabel="Save note"
                style={[
                  styles.modalSaveButton,
                  (!noteInputText.trim() || isSavingNote) && styles.modalSaveButtonDisabled,
                ]}
              >
                <Text style={styles.modalSaveText}>
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </Text>
              </ScalePressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm + 4,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBrandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  headerBrandTextCol: {
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  headerBrandSub: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  greetingTextCol: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  streakWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Layout.shadows.subtle,
  },
  streakNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginRight: 8,
  },
  streakCol: {
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  streakBest: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  weeklyHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  viewScheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewScheduleLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 2,
  },
  weekRhythmContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Layout.spacing.sm,
    ...Layout.shadows.subtle,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginHorizontal: 2,
  },
  dayChipToday: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  dayChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: Colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  dayAbbr: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  dayAbbrToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dayAbbrSelected: {
    color: '#CBD5E1',
  },
  dayDateNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 3,
  },
  dayDateNumberToday: {
    color: Colors.primary,
    fontWeight: '900',
  },
  dayDateNumberSelected: {
    color: '#FFFFFF',
  },
  dayStatusIndicator: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  plannedDotToday: {
    backgroundColor: Colors.primary,
  },
  plannedDotSelected: {
    backgroundColor: '#00C8FF',
  },
  restBar: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#94A3B8',
  },
  restBarSelected: {
    backgroundColor: '#CBD5E1',
  },
  selectedDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.subtle,
  },
  selectedDayHeaderBadgeRow: {
    marginBottom: 8,
  },
  selectedDayHeaderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  selectedDayWorkoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  selectedDayWorkoutMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  selectedDayCta: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Layout.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayCtaText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  restDayNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Layout.borderRadius.md,
  },
  restDayNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: '#FEF9E7',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.subtle,
  },
  feedbackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  feedbackIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  feedbackTextCol: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 2,
  },
  feedbackSub: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  leaveNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE047',
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.sm + 2,
    paddingHorizontal: Layout.spacing.lg,
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  leaveNoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
  savedNoteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedNoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedNoteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 1.2,
  },
  savedNoteDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  savedNoteQuote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
    fontStyle: 'italic',
    marginBottom: 14,
    lineHeight: 20,
  },
  savedNoteActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE047',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editNoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  deleteNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteNoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 21, 84, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    ...Layout.shadows.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 110,
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
