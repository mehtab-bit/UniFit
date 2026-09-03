import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Streak Components
import { StreakHero } from '../../components/streak/StreakHero';
import { MonthlyFitnessCalendar } from '../../components/streak/MonthlyFitnessCalendar';
import { MonthlyStats } from '../../components/streak/MonthlyStats';
import { TodayWorkout } from '../../components/streak/TodayWorkout';
import { TomorrowWorkout } from '../../components/streak/TomorrowWorkout';
import { UpcomingPlan } from '../../components/streak/UpcomingPlan';

// Services & Models
import { streakService, workoutService } from '../../services';
import { StreakData, CalendarDay, WorkoutDay, PlanWorkoutItem } from '../../types/domain';
import { getAppToday, formatMonthYear } from '../../utils/date';
import { calculateMonthStats } from '../../utils/calendar';

export default function StreakPlanScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Centralized reference date
  const referenceDate = useMemo(() => getAppToday(), []);

  // Dynamic Month & Year Navigation State
  const [currentYear, setCurrentYear] = useState<number>(() => referenceDate.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(() => referenceDate.getMonth());

  // Data States
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [tomorrowWorkout, setTomorrowWorkout] = useState<WorkoutDay | null>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthName = formatMonthYear(currentYear, currentMonthIndex);
  const isCurrentRealMonth =
    currentYear === referenceDate.getFullYear() &&
    currentMonthIndex === referenceDate.getMonth();

  // Screen Reader announcement on entry
  useScreenAnnouncement(
    `Streak and Monthly Fitness Plan screen. ${streakData?.currentStreak || 5} day streak active. Viewing ${monthName} calendar.`
  );

  const loadStreakAndWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [streakRes, daysRes, todayRes, tomorrowRes, upcomingRes] = await Promise.all([
        streakService.getStreakData(user?.id),
        streakService.getMonthlyCalendar(currentYear, currentMonthIndex, user?.id),
        workoutService.getTodayWorkout(user?.id),
        workoutService.getTomorrowWorkout(user?.id),
        workoutService.getUpcomingWorkouts(user?.id),
      ]);

      setStreakData(streakRes);
      setCalendarDays(daysRes);
      setTodayWorkout(todayRes);
      setTomorrowWorkout(tomorrowRes);
      setUpcomingWorkouts(upcomingRes);

      const activeToday = daysRes.find((d) => d.status === 'today');
      setSelectedDay(activeToday || daysRes[0] || null);
    } catch (err) {
      setError('Unable to load streak and fitness calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentYear, currentMonthIndex]);

  useEffect(() => {
    loadStreakAndWorkouts();
  }, [loadStreakAndWorkouts]);

  // Dynamically recompute month stats for viewed month
  const activeMonthStats = useMemo<StreakData>(() => {
    const stats = calculateMonthStats(calendarDays as any);
    return {
      currentStreak: streakData?.currentStreak || 5,
      bestStreak: streakData?.bestStreak || 12,
      monthlyWorkouts: stats.monthlyWorkouts,
      monthlyCompleted: stats.monthlyCompleted,
      monthlyMissed: stats.monthlyMissed,
      consistency: stats.consistency,
      monthName,
    };
  }, [calendarDays, streakData, monthName]);

  const handlePrevMonth = () => {
    let nextMonth = currentMonthIndex - 1;
    let nextYear = currentYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    setCurrentMonthIndex(nextMonth);
    setCurrentYear(nextYear);
    AccessibilityInfo.announceForAccessibility(`Switched to ${formatMonthYear(nextYear, nextMonth)} calendar`);
  };

  const handleNextMonth = () => {
    let nextMonth = currentMonthIndex + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setCurrentMonthIndex(nextMonth);
    setCurrentYear(nextYear);
    AccessibilityInfo.announceForAccessibility(`Switched to ${formatMonthYear(nextYear, nextMonth)} calendar`);
  };

  const handleJumpToToday = () => {
    const todayYear = referenceDate.getFullYear();
    const todayMonth = referenceDate.getMonth();
    setCurrentYear(todayYear);
    setCurrentMonthIndex(todayMonth);
    AccessibilityInfo.announceForAccessibility(`Jumped to today in ${formatMonthYear(todayYear, todayMonth)}`);
  };

  const handleSelectDay = (day: CalendarDay) => {
    setSelectedDay(day);
    AccessibilityInfo.announceForAccessibility(
      `Selected ${day.dayOfWeek} ${monthName.split(' ')[0]} ${day.dayNumber}. ${day.workoutTitle || 'Rest Day'}. Status: ${day.status}.`
    );
  };

  const handleStartWorkout = () => {
    router.push('/(app)/workout');
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  // Convert WorkoutDay to PlanWorkoutItem adapter
  const todayWorkoutItem: PlanWorkoutItem = {
    id: todayWorkout?.id || 'today-workout',
    dayLabel: 'TODAY',
    title: todayWorkout?.title || 'Full Body Strength Session',
    focus: todayWorkout?.focus || 'Functional chair squat & supported movement baseline',
    meta: todayWorkout?.meta || '4 exercises • 25 min',
    category: todayWorkout?.category || 'Strength',
    status: 'today',
  };

  const tomorrowWorkoutItem: PlanWorkoutItem = {
    id: tomorrowWorkout?.id || 'tomorrow-workout',
    dayLabel: 'TOMORROW',
    title: tomorrowWorkout?.title || 'Run-Walk Session',
    focus: tomorrowWorkout?.focus || '20 min • 2.0 km',
    meta: tomorrowWorkout?.meta || 'Cardio',
    category: tomorrowWorkout?.category || 'Cardio',
    status: 'planned',
  };

  const upcomingPlanItems: PlanWorkoutItem[] = upcomingWorkouts.map((w) => ({
    id: w.id,
    dayLabel: w.dayOfWeek,
    title: w.title,
    focus: w.focus || '',
    meta: w.meta || '',
    category: w.category || 'General',
    status: w.status,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Screen Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <ScalePressable
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to Home"
          accessibilityHint="Returns to the main dashboard"
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </ScalePressable>

        <Text style={styles.headerTitle}>Streak & Plan</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadStreakAndWorkouts}>
          {/* Streak Hero Section */}
          <CardSpringEntry index={0}>
            <StreakHero
              currentStreak={activeMonthStats.currentStreak}
              bestStreak={activeMonthStats.bestStreak}
              motivationalHeadline="You're on a roll!"
              motivationalSubtext="Keep your momentum going."
            />
          </CardSpringEntry>

          {/* Real Dynamic Monthly Fitness Calendar */}
          <CardSpringEntry index={1}>
            <MonthlyFitnessCalendar
              monthName={monthName}
              days={calendarDays as any}
              selectedDay={selectedDay as any}
              onSelectDay={handleSelectDay}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onJumpToToday={handleJumpToToday}
              isCurrentRealMonth={isCurrentRealMonth}
              onStartWorkoutForDay={handleStartWorkout}
            />
          </CardSpringEntry>

          {/* Live Monthly Statistics Section */}
          <CardSpringEntry index={2}>
            <MonthlyStats stats={activeMonthStats} />
          </CardSpringEntry>

          {/* Today's Workout Plan & CTA */}
          <CardSpringEntry index={3}>
            <TodayWorkout
              workout={todayWorkoutItem}
              onStartWorkout={handleStartWorkout}
            />
          </CardSpringEntry>

          {/* Tomorrow's Workout Plan */}
          <CardSpringEntry index={4}>
            <TomorrowWorkout workout={tomorrowWorkoutItem} />
          </CardSpringEntry>

          {/* Upcoming Days Plan */}
          <CardSpringEntry index={5}>
            <UpcomingPlan items={upcomingPlanItems} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 2,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  headerRightPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
});
