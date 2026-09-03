import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { CalendarDayItem, CalendarDayStatus } from '../../types/streak';
import { ScalePressable } from '../animations/ScalePressable';

interface MonthlyFitnessCalendarProps {
  monthName: string;
  days: CalendarDayItem[];
  selectedDay: CalendarDayItem | null;
  onSelectDay: (day: CalendarDayItem) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday?: () => void;
  isCurrentRealMonth?: boolean;
  onStartWorkoutForDay?: (day: CalendarDayItem) => void;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MonthlyFitnessCalendar: React.FC<MonthlyFitnessCalendarProps> = ({
  monthName,
  days,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  isCurrentRealMonth = true,
  onStartWorkoutForDay,
}) => {
  const getDayAccessibilityLabel = (item: CalendarDayItem) => {
    const statusText = {
      completed: `Completed workout: ${item.workoutTitle || 'Done'}`,
      missed: `Missed workout: ${item.workoutTitle || 'Not completed'}`,
      rest: 'Rest day',
      planned: `Upcoming planned workout: ${item.workoutTitle || 'Scheduled'}`,
      today: `Today. ${item.workoutTitle || 'Workout planned'}`,
    }[item.status];

    const currentMonthPrefix = item.isCurrentMonth ? '' : 'Other month ';
    const isSelectedText = selectedDay?.date === item.date ? ' Selected.' : '';
    return `${currentMonthPrefix}${item.dayOfWeek} ${monthName.split(' ')[0]} ${item.dayNumber}. ${statusText}.${isSelectedText}`;
  };

  const renderStatusIndicator = (status: CalendarDayStatus, isCurrentMonth = true) => {
    switch (status) {
      case 'completed':
        return (
          <View style={styles.indicatorCompleted}>
            <Feather name="check" size={11} color={Colors.textInverse} />
          </View>
        );
      case 'missed':
        return (
          <View style={styles.indicatorMissed}>
            <Feather name="x" size={10} color="#9CA3AF" />
          </View>
        );
      case 'today':
        return (
          <View style={styles.indicatorToday}>
            <View style={styles.todayInnerDot} />
          </View>
        );
      case 'planned':
        return (
          <View
            style={[
              styles.indicatorPlanned,
              !isCurrentMonth && { opacity: 0.4 },
            ]}
          />
        );
      case 'rest':
      default:
        return <View style={styles.indicatorRest} />;
    }
  };

  const getStatusBadgeStyle = (status: CalendarDayStatus) => {
    switch (status) {
      case 'completed':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: Colors.primary, label: 'Completed' };
      case 'today':
        return { bg: Colors.primary, border: Colors.primary, text: Colors.textInverse, label: "Today's Plan" };
      case 'planned':
        return { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', label: 'Planned' };
      case 'missed':
        return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', label: 'Missed' };
      case 'rest':
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: Colors.textSecondary, label: 'Rest Day' };
    }
  };

  return (
    <View
      style={styles.calendarContainer}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Monthly Fitness Calendar for ${monthName}. Double tap dates to inspect details.`}
    >
      {/* Interactive Month Navigation Header */}
      <View style={styles.headerRow}>
        <View style={styles.monthTitleCol}>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <Text style={styles.monthSubtitle}>Workout History & Planning</Text>
        </View>

        {/* Navigation Controls: < [Today] > */}
        <View style={styles.navControlsRow}>
          <ScalePressable
            onPress={onPrevMonth}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            accessibilityHint="Navigates to the previous month calendar"
            style={styles.navArrowBtn}
          >
            <Feather name="chevron-left" size={20} color={Colors.text} />
          </ScalePressable>

          {onJumpToToday ? (
            <ScalePressable
              onPress={onJumpToToday}
              accessibilityRole="button"
              accessibilityLabel="Jump to Today"
              accessibilityHint="Snaps calendar back to current month and today"
              style={[
                styles.todayPillBtn,
                isCurrentRealMonth && styles.todayPillBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.todayPillText,
                  isCurrentRealMonth && styles.todayPillTextActive,
                ]}
              >
                Today
              </Text>
            </ScalePressable>
          ) : null}

          <ScalePressable
            onPress={onNextMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityHint="Navigates to the next month calendar"
            style={styles.navArrowBtn}
          >
            <Feather name="chevron-right" size={20} color={Colors.text} />
          </ScalePressable>
        </View>
      </View>

      {/* Days of Week Header (M T W T F S S) */}
      <View style={styles.weekHeaderRow} accessible={false} importantForAccessibility="no">
        {WEEK_DAYS.map((day, idx) => (
          <View key={`weekday-${idx}`} style={styles.weekHeaderCell}>
            <Text style={styles.weekHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.gridContainer}>
        {days.map((item, index) => {
          const isToday = item.status === 'today';
          const isCurrent = item.isCurrentMonth !== false;
          const isSelected = selectedDay?.date === item.date;

          return (
            <TouchableOpacity
              key={`${item.date}-${index}`}
              activeOpacity={0.7}
              onPress={() => onSelectDay(item)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={getDayAccessibilityLabel(item)}
              accessibilityHint="Double tap to inspect workout details for this day"
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
                !isCurrent && styles.dayCellOutOfMonth,
              ]}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  isToday && styles.dayNumberTextToday,
                  isSelected && styles.dayNumberTextSelected,
                  !isCurrent && styles.dayNumberTextOutOfMonth,
                ]}
              >
                {item.dayNumber}
              </Text>
              <View style={styles.indicatorContainer}>
                {renderStatusIndicator(item.status, isCurrent)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Inspector Card */}
      {selectedDay ? (
        <View
          style={styles.inspectorCard}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Selected date details: ${selectedDay.dayOfWeek}, ${monthName.split(' ')[0]} ${selectedDay.dayNumber}. ${selectedDay.workoutTitle || 'Rest Day'}. Status: ${selectedDay.status}.`}
        >
          <View style={styles.inspectorTopRow}>
            <View style={styles.inspectorDateCol}>
              <Text style={styles.inspectorDateText}>
                {selectedDay.dayOfWeek}, {monthName.split(' ')[0]} {selectedDay.dayNumber}
              </Text>
              <Text style={styles.inspectorWorkoutTitle}>
                {selectedDay.workoutTitle || 'Rest & Recovery'}
              </Text>
            </View>

            {(() => {
              const badge = getStatusBadgeStyle(selectedDay.status);
              return (
                <View
                  style={[
                    styles.inspectorBadge,
                    { backgroundColor: badge.bg, borderColor: badge.border },
                  ]}
                >
                  <Text style={[styles.inspectorBadgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })()}
          </View>

          {selectedDay.workoutMeta ? (
            <Text style={styles.inspectorMetaText}>{selectedDay.workoutMeta}</Text>
          ) : null}

          {/* Activity & Duration Pills */}
          <View style={styles.inspectorDetailsRow}>
            {selectedDay.activity ? (
              <View style={styles.inspectorDetailPill}>
                <Feather name="activity" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.inspectorDetailPillText}>
                  {selectedDay.activity.toUpperCase()}
                </Text>
              </View>
            ) : null}

            {selectedDay.durationMinutes && selectedDay.durationMinutes > 0 ? (
              <View style={styles.inspectorDetailPill}>
                <Feather name="clock" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.inspectorDetailPillText}>
                  {selectedDay.durationMinutes} min
                </Text>
              </View>
            ) : null}
          </View>

          {/* Day Nutrition Targets Snapshot */}
          {selectedDay.nutritionSummary ? (
            <View style={styles.inspectorNutritionBox}>
              <View style={styles.inspectorNutritionHeader}>
                <Feather name="pie-chart" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.inspectorNutritionTitle}>DAILY NUTRITION ALLOCATION</Text>
              </View>
              <View style={styles.inspectorMacrosRow}>
                <Text style={styles.inspectorMacroText}>
                  <Text style={{ fontWeight: '800', color: Colors.text }}>
                    {selectedDay.nutritionSummary.calories}
                  </Text> kcal
                </Text>
                <Text style={styles.inspectorMacroDivider}>•</Text>
                <Text style={styles.inspectorMacroText}>
                  Protein: <Text style={{ fontWeight: '700', color: '#2563EB' }}>{selectedDay.nutritionSummary.proteinG}g</Text>
                </Text>
                <Text style={styles.inspectorMacroDivider}>•</Text>
                <Text style={styles.inspectorMacroText}>
                  Carbs: <Text style={{ fontWeight: '700', color: '#059669' }}>{selectedDay.nutritionSummary.carbsG}g</Text>
                </Text>
                <Text style={styles.inspectorMacroDivider}>•</Text>
                <Text style={styles.inspectorMacroText}>
                  Fat: <Text style={{ fontWeight: '700', color: '#D97706' }}>{selectedDay.nutritionSummary.fatG}g</Text>
                </Text>
              </View>
            </View>
          ) : null}

          {/* Quick Action Button */}
          {selectedDay.status === 'today' || selectedDay.status === 'planned' ? (
            <ScalePressable
              activeScale={0.97}
              onPress={() => onStartWorkoutForDay?.(selectedDay)}
              accessibilityRole="button"
              accessibilityLabel={`Start workout for ${selectedDay.dayOfWeek} ${selectedDay.dayNumber}`}
              style={styles.inspectorActionBtn}
            >
              <Feather name="play" size={14} color={Colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={styles.inspectorActionBtnText}>
                {selectedDay.status === 'today' ? 'Start Today’s Workout' : 'Preview Workout Plan'}
              </Text>
            </ScalePressable>
          ) : null}
        </View>
      ) : null}

      {/* Visual Legend */}
      <View
        style={styles.legendRow}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel="Calendar legend: Completed in blue check, Missed in gray cross, Today in blue ring, Planned in light blue dot, Rest in small dash"
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]}>
            <Feather name="check" size={8} color="#FFF" />
          </View>
          <Text style={styles.legendText}>Completed</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' }]}>
            <Feather name="x" size={8} color="#9CA3AF" />
          </View>
          <Text style={styles.legendText}>Missed</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: Colors.primary }]}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary }} />
          </View>
          <Text style={styles.legendText}>Today</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#BFDBFE' }]} />
          <Text style={styles.legendText}>Planned</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  monthTitleCol: {
    flex: 1,
  },
  monthTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  monthSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  navControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPillBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayPillBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  todayPillText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  todayPillTextActive: {
    color: Colors.primary,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeaderText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7 days in week
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.md,
  },
  dayCellToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayCellSelected: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayCellOutOfMonth: {
    opacity: 0.35,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  dayNumberTextToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dayNumberTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  dayNumberTextOutOfMonth: {
    color: Colors.textMuted,
  },
  indicatorContainer: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorCompleted: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorMissed: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorToday: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  todayInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  indicatorPlanned: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#93C5FD',
  },
  indicatorRest: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#E5E7EB',
  },
  inspectorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Layout.spacing.md,
  },
  inspectorTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inspectorDateCol: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  inspectorDateText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inspectorWorkoutTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  inspectorBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
  },
  inspectorBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  inspectorMetaText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: Layout.spacing.xs,
  },
  inspectorDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  inspectorDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inspectorDetailPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  inspectorNutritionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.sm,
    padding: Layout.spacing.xs + 2,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inspectorNutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  inspectorNutritionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  inspectorMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  inspectorMacroText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  inspectorMacroDivider: {
    marginHorizontal: 4,
    color: '#CBD5E1',
    fontSize: 10,
  },
  inspectorActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: Layout.spacing.md,
    marginTop: Layout.spacing.xs,
  },
  inspectorActionBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textInverse,
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
    marginTop: Layout.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
