import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { StreakSummary } from '../../components/streak/StreakSummary';
import { HomeTodayWorkoutCard } from '../../components/workout/HomeTodayWorkoutCard';
import { NutritionSnapshotCard } from '../../components/nutrition/NutritionSnapshotCard';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Services & Domain Models
import { workoutService, streakService, nutritionService } from '../../services';
import { WorkoutPlan, WorkoutDay, StreakData, NutritionTargets } from '../../types/domain';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, profileRevision } = useAuth();

  // Screen announcement for screen readers
  useScreenAnnouncement("Home screen. Good morning! Here's your weekly fitness plan and daily targets.");

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

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [planResult, todayResult, streakResult, nutritionResult] = await Promise.all([
        workoutService.getWeeklyPlan(user?.id, profileRevision > 0),
        workoutService.getTodayWorkout(user?.id),
        streakService.getStreakData(user?.id),
        nutritionService.getDailyTargets(user?.id),
      ]);
      setWeeklyPlan(planResult);
      setTodayWorkout(todayResult);
      setStreakData(streakResult);
      setNutritionTargets(nutritionResult);
    } catch (err) {
      setError('Unable to load fitness dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, profileRevision]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const renderIcon = (item: WorkoutDay) => {
    if (item.iconFamily === 'feather') {
      return <Feather name={(item.iconName as any) || 'activity'} size={22} color={item.iconColor || Colors.primary} />;
    }
    return <MaterialCommunityIcons name={(item.iconName as any) || 'dumbbell'} size={22} color={item.iconColor || Colors.primary} />;
  };

  const handleOpenStreakPlan = () => {
    router.push('/(app)/streak-plan');
  };

  const handleStartWorkout = () => {
    router.push('/(app)/workout');
  };

  const handleOpenFood = () => {
    router.push('/(app)/food');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Top Header */}
      <View style={styles.topHeader} accessible={true} accessibilityRole="header">
        {/* Hamburger Menu Button */}
        <ScalePressable
          onPress={() => router.push('/(app)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open navigation menu"
          accessibilityHint="Navigates to your profile and settings"
          style={styles.headerIconButton}
        >
          <Feather name="menu" size={24} color={Colors.text} />
        </ScalePressable>

        {/* Center Logo & Title */}
        <View style={styles.headerBrandCol}>
          <Text style={styles.headerBrandTitle}>UniFit</Text>
          <Text style={styles.headerBrandSub}>UNIVERSAL FITNESS</Text>
        </View>

        {/* User Profile Avatar */}
        <ScalePressable
          onPress={() => router.push('/(app)/profile')}
          accessibilityRole="button"
          accessibilityLabel={`Profile of ${firstName}`}
          accessibilityHint="Opens profile and accessibility settings"
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
          {/* Unified Greeting & Compact Streak Header */}
          <CardSpringEntry index={0}>
            <View style={styles.greetingHeaderRow}>
              {/* Left Greeting Text */}
              <View style={styles.greetingTextCol}>
                <Text style={styles.greetingTitle}>Good morning, {firstName}!</Text>
                <Text style={styles.greetingSubtitle}>
                  {weeklyPlan?.subtitle || "Here's your plan for this week."}
                </Text>
              </View>

              {/* Right Compact Streak Widget */}
              <StreakSummary
                currentStreak={streakData?.currentStreak || 5}
                bestStreak={streakData?.bestStreak || 12}
                onPress={handleOpenStreakPlan}
              />
            </View>
          </CardSpringEntry>

          {/* Today's Scheduled Workout Hero Card */}
          {todayWorkout ? (
            <CardSpringEntry index={1}>
              <HomeTodayWorkoutCard
                workout={todayWorkout}
                onStartWorkout={handleStartWorkout}
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

          {/* Section Heading for Weekly Schedule */}
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

          {/* Weekly Schedule Rows (Monday to Sunday) */}
          {(weeklyPlan?.days || []).map((item, index) => {
            const isToday = item.status === 'today';
            const isRest = item.category?.toLowerCase() === 'rest';

            return (
              <CardSpringEntry key={item.id} index={index + 3}>
                <ScalePressable
                  activeScale={0.98}
                  onPress={isRest ? undefined : handleStartWorkout}
                  disabled={isRest}
                  accessibilityRole={isRest ? 'text' : 'button'}
                  accessibilityLabel={`${item.dayOfWeek} ${item.dayNumber}. ${item.title}. ${item.focus || ''}. ${item.meta || ''}. Status: ${item.status}.${isRest ? ' Rest day.' : ' Double tap to start workout.'}`}
                  accessibilityHint={isRest ? undefined : 'Launches exercise coaching'}
                  style={[
                    styles.workoutRowCard,
                    isToday && styles.workoutRowCardToday,
                    isRest && styles.workoutRowCardRest,
                  ]}
                >
                  {/* Day & Date Column */}
                  <View style={styles.dateCol}>
                    <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
                      {item.dayOfWeek}
                    </Text>
                    <Text style={[styles.dateNumber, isToday && styles.dateNumberToday]}>
                      {item.dayNumber}
                    </Text>
                  </View>

                  {/* Vertical Divider */}
                  <View style={[styles.rowDivider, isToday && styles.rowDividerToday]} />

                  {/* Workout Category Icon */}
                  <View style={[styles.workoutIconCircle, { backgroundColor: item.iconBg || '#EFF6FF' }]}>
                    {renderIcon(item)}
                  </View>

                  {/* Workout Details Column */}
                  <View style={styles.workoutInfoCol}>
                    <Text style={styles.workoutTitle}>{item.title}</Text>
                    <Text style={styles.workoutMeta}>{item.meta || item.focus || 'Scheduled session'}</Text>
                  </View>

                  {/* Status Badge & Chevron */}
                  <View style={styles.statusCol}>
                    <View
                      style={[
                        styles.statusBadge,
                        isToday ? styles.statusBadgeToday : isRest ? styles.statusBadgeRest : styles.statusBadgePlanned,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isToday ? styles.statusBadgeTextToday : isRest ? styles.statusBadgeTextRest : styles.statusBadgeTextPlanned,
                        ]}
                      >
                        {isToday ? 'Today' : isRest ? 'Rest' : 'Planned'}
                      </Text>
                    </View>
                    {!isRest ? (
                      <Feather name="chevron-right" size={18} color={Colors.textSecondary} style={{ marginLeft: 6 }} />
                    ) : null}
                  </View>
                </ScalePressable>
              </CardSpringEntry>
            );
          })}

          {/* Bottom Feedback Card */}
          <CardSpringEntry index={12}>
            <View
              style={styles.feedbackCard}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel="How was your workout today? Share your experience and help us improve your plan."
            >
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
                onPress={() => router.push('/(app)/activity')}
                accessibilityRole="button"
                accessibilityLabel="Leave a Note"
                accessibilityHint="Opens feedback and workout log input"
                style={styles.leaveNoteButton}
              >
                <Text style={styles.leaveNoteText}>Leave a Note</Text>
                <Feather name="chevron-right" size={14} color="#78350F" style={{ marginLeft: 2 }} />
              </ScalePressable>
            </View>
          </CardSpringEntry>
        </AsyncStateView>
      </ScrollView>
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
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  headerBrandSub: {
    fontSize: 9,
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
    gap: 12,
  },
  greetingTextCol: {
    flex: 1,
    paddingRight: 4,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    ...Typography.bodyMedium,
    color: '#4B5563',
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  weeklyHeaderTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
  },
  viewScheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewScheduleLinkText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 2,
  },
  workoutRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.sm + 2,
    minHeight: 74,
    ...Layout.shadows.subtle,
  },
  workoutRowCardToday: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    ...Layout.shadows.card,
  },
  workoutRowCardRest: {
    opacity: 0.85,
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  dateCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 1,
  },
  dateNumberToday: {
    color: Colors.primary,
  },
  rowDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.sm + 2,
  },
  rowDividerToday: {
    backgroundColor: '#BFDBFE',
  },
  workoutIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  workoutInfoCol: {
    flex: 1,
    marginRight: Layout.spacing.xs,
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  workoutFocus: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  workoutMeta: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
  },
  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
  },
  statusBadgeToday: {
    backgroundColor: Colors.primary,
  },
  statusBadgePlanned: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusBadgeRest: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextToday: {
    color: Colors.textInverse,
  },
  statusBadgeTextPlanned: {
    color: '#16A34A',
  },
  statusBadgeTextRest: {
    color: '#DB2777',
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
});
