import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { AnimatedProgressRing } from '../../components/animations/AnimatedProgressRing';
import { AnimatedNumberCounter } from '../../components/animations/AnimatedNumberCounter';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Services & Domain Models
import { progressService } from '../../services';
import { ProgressSummary } from '../../types/domain';

export default function ProgressScreen() {
  const { user } = useAuth();
  useScreenAnnouncement('Progress and Milestone Journey screen. Track your monthly consistency and milestones.');

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgressData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getProgressSummary(user?.id);
      setSummary(data);
    } catch (err) {
      setError('Unable to load progress metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const monthlyConsistency = summary?.monthlyConsistency ?? 83;
  const adherenceScore = summary?.adherenceScore ?? 100;
  const phaseTitle = summary?.phaseTitle ?? 'Week 1 • Phase 1 Calibration';

  const getMilestoneStatusBadge = (status: string) => {
    const s = status.toLowerCase().replace(/\s+/g, '_');
    switch (s) {
      case 'completed':
        return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', icon: 'check-circle' };
      case 'in_progress':
      case 'ready':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: Colors.primary, icon: 'play-circle' };
      default:
        return { bg: '#F1F5F9', border: '#E2E8F0', text: Colors.textSecondary, icon: 'circle' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Screen Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <Text style={styles.headerTitle}>Progress & Journey</Text>
        <Text style={styles.headerSubtitle}>Consistency metrics & progression milestones</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadProgressData}>
          {/* Dominant Visual Hero Metric: 83% Monthly Consistency */}
          <CardSpringEntry index={0}>
            <View
              style={styles.progressHeroCard}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`Monthly Consistency: ${monthlyConsistency} percent. ${phaseTitle}.`}
            >
              <View style={styles.heroContentRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.heroBadge}>CONSISTENCY CRUX</Text>
                  <View style={styles.heroNumberRow}>
                    <AnimatedNumberCounter
                      value={monthlyConsistency}
                      suffix="%"
                      style={styles.heroNumber}
                      accessibilityLabel={`${monthlyConsistency} percent`}
                    />
                  </View>
                  <Text style={styles.heroNumberLabel}>MONTHLY CONSISTENCY</Text>
                  <Text style={styles.heroPhaseText}>{phaseTitle}</Text>

                  {summary?.activity_rule_week ? (
                    <View style={styles.progWeekPill}>
                      <Text style={styles.progWeekText}>
                        Progression Week {summary.activity_rule_week} Active
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Large Progress Ring */}
                <AnimatedProgressRing
                  progress={monthlyConsistency}
                  size={96}
                  strokeWidth={8}
                  color="#00C8FF"
                  backgroundColor="#07328D"
                  label="MONTH"
                />
              </View>
            </View>
          </CardSpringEntry>

          {/* Supporting Metrics Bar (Streak, Workouts, Active Min) */}
          <CardSpringEntry index={1}>
            <View style={styles.supportMetricsRow}>
              {/* Streak */}
              <View style={styles.supportMetricItem}>
                <View style={styles.supportIconCircle}>
                  <MaterialCommunityIcons name="fire" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.supportMetricValue}>{summary?.currentStreak || 5}</Text>
                <Text style={styles.supportMetricLabel}>DAY STREAK</Text>
              </View>

              <View style={styles.supportDivider} />

              {/* Workouts */}
              <View style={styles.supportMetricItem}>
                <View style={styles.supportIconCircle}>
                  <MaterialCommunityIcons name="dumbbell" size={16} color="#059669" />
                </View>
                <Text style={styles.supportMetricValue}>{summary?.workoutsCompleted || 10}</Text>
                <Text style={styles.supportMetricLabel}>WORKOUTS</Text>
              </View>

              <View style={styles.supportDivider} />

              {/* Active Minutes */}
              <View style={styles.supportMetricItem}>
                <View style={styles.supportIconCircle}>
                  <Feather name="clock" size={15} color="#7C3AED" />
                </View>
                <Text style={styles.supportMetricValue}>{summary?.totalActiveMinutes || 245}</Text>
                <Text style={styles.supportMetricLabel}>ACTIVE MIN</Text>
              </View>
            </View>
          </CardSpringEntry>

          {/* Milestone Progression Vertical Journey */}
          <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">
            PROGRESSION JOURNEY
          </Text>

          <CardSpringEntry index={2}>
            <View style={styles.timelineCard}>
              {(summary?.milestones || []).map((m, index, arr) => {
                const badge = getMilestoneStatusBadge(m.status);
                const isLast = index === arr.length - 1;
                const normalizedStatus = (m.status as string).toLowerCase().replace(/\s+/g, '_');
                const isCompleted = normalizedStatus === 'completed';
                const isInProgress = normalizedStatus === 'in_progress' || normalizedStatus === 'ready';

                return (
                  <View key={m.id} style={styles.timelineItemRow}>
                    {/* Left Node & Vertical Line */}
                    <View style={styles.nodeColumn}>
                      <View
                        style={[
                          styles.timelineNode,
                          isCompleted && styles.timelineNodeCompleted,
                          isInProgress && styles.timelineNodeInProgress,
                        ]}
                      >
                        {isCompleted ? (
                          <Feather name="check" size={11} color="#FFFFFF" />
                        ) : isInProgress ? (
                          <View style={styles.nodePulseInner} />
                        ) : (
                          <View style={styles.nodeQuietInner} />
                        )}
                      </View>

                      {!isLast ? (
                        <View
                          style={[
                            styles.timelineLine,
                            isCompleted && styles.timelineLineCompleted,
                          ]}
                        />
                      ) : null}
                    </View>

                    {/* Right Milestone Information */}
                    <View style={styles.milestoneContentCol}>
                      <View style={styles.milestoneTitleRow}>
                        <Text style={styles.milestoneTitleText}>{m.title}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: badge.bg, borderColor: badge.border },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                            {m.status.toUpperCase().replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.milestoneDateText}>{m.date}</Text>
                    </View>
                  </View>
                );
              })}
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
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: '#040E34',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  progressHeroCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#07328D',
    ...Layout.shadows.card,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 46,
  },
  heroNumberLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9FA9',
    letterSpacing: 1,
    marginTop: 2,
  },
  heroPhaseText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  progWeekPill: {
    backgroundColor: 'rgba(0, 200, 255, 0.12)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.3)',
  },
  progWeekText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C8FF',
  },
  supportMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  supportMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  supportIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  supportMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#040E34',
  },
  supportMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  supportDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: 1,
    marginBottom: Layout.spacing.sm + 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadows.subtle,
  },
  timelineItemRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timelineNodeInProgress: {
    borderColor: '#2166BF',
    backgroundColor: '#EFF6FF',
  },
  nodePulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2166BF',
  },
  nodeQuietInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#10B981',
  },
  milestoneContentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  milestoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#040E34',
    flex: 1,
    paddingRight: 6,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  milestoneDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
