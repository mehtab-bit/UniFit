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
import { progressService } from '../../services';
import { ProgressSummary } from '../../types/domain';
import { Surface } from '../../context/SurfaceContext';
import { resolveProgressionWeek } from '../../utils/progressionWeek';

const JOURNEY_PHASES = ['CALIBRATION', 'FOUNDATION', 'BUILD', 'PROGRESS'];

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

  const monthlyConsistency = summary?.monthlyConsistency ?? 0;
  const currentStreak = summary?.currentStreak ?? 0;
  const workoutsCompleted = summary?.workoutsCompleted ?? 0;
  const totalActiveMinutes = summary?.totalActiveMinutes ?? 0;
  const phaseTitle = summary?.phaseTitle ?? 'Week 1 • Phase 1 Calibration';
  const progressionWeek = resolveProgressionWeek(summary?.activity_rule_week);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Screen Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadProgressData}>
          
          <CardSpringEntry index={0}>
            <Surface type="dark">
              <View
                style={styles.progressHeroCard}
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`Monthly Consistency: ${monthlyConsistency} percent. ${phaseTitle}.`}
              >
                <View style={styles.heroContentRow}>
                  <View style={styles.heroTextCol}>
                    <Text style={styles.heroBadge}>CONSISTENCY</Text>
                    <View style={styles.heroNumberRow}>
                      <AnimatedNumberCounter
                        value={monthlyConsistency}
                        suffix="%"
                        surface="dark"
                        style={styles.heroNumber}
                        accessibilityLabel={`${monthlyConsistency} percent`}
                      />
                    </View>
                    <Text style={styles.heroPhaseText}>MONTHLY SCORE</Text>
                    {typeof progressionWeek === 'number' ? (
                       <View style={styles.progWeekPill}>
                         <Text style={styles.progWeekText}>
                           Progression Week {progressionWeek} Active
                         </Text>
                       </View>
                     ) : null}
                  </View>

                  {/* Large Progress Ring */}
                  <AnimatedProgressRing
                    progress={monthlyConsistency}
                    size={120}
                    strokeWidth={10}
                    color="#D4AF37" // Premium Gold
                    backgroundColor="#1A1A1A"
                    label="MONTH"
                    surface="dark"
                    textColor="#FFFFFF"
                    labelColor="#CBD5E1"
                  />
                </View>
              </View>
            </Surface>
          </CardSpringEntry>

          <CardSpringEntry index={1}>
            <View style={styles.supportMetricsRow}>
              {/* Streak */}
              <View style={styles.supportMetricItem}>
                <MaterialCommunityIcons name="fire" size={24} color="#D4AF37" />
                <Text style={styles.supportMetricValue}>{currentStreak}</Text>
                <Text style={styles.supportMetricLabel}>DAY STREAK</Text>
              </View>

              <View style={styles.supportDivider} />

              {/* Workouts */}
              <View style={styles.supportMetricItem}>
                <MaterialCommunityIcons name="dumbbell" size={24} color="#D4AF37" />
                <Text style={styles.supportMetricValue}>{workoutsCompleted}</Text>
                <Text style={styles.supportMetricLabel}>WORKOUTS</Text>
              </View>

              <View style={styles.supportDivider} />

              {/* Active Minutes */}
              <View style={styles.supportMetricItem}>
                <Feather name="clock" size={22} color="#D4AF37" />
                <Text style={styles.supportMetricValue}>{totalActiveMinutes}</Text>
                <Text style={styles.supportMetricLabel}>ACTIVE MIN</Text>
              </View>
            </View>
          </CardSpringEntry>

          <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">
            JOURNEY
          </Text>

          <CardSpringEntry index={2}>
            <View style={styles.timelineCard}>
              {JOURNEY_PHASES.map((phase, index) => {
                // Find a matching milestone conceptually or visually represent the static phase
                const isCompleted = index === 0;
                const isActive = index === 1;
                const isUpcoming = index > 1;
                
                const milestone = summary?.milestones?.[index];

                return (
                  <View key={phase} style={styles.timelineItemRow}>
                    <View style={styles.nodeColumn}>
                      <View
                        style={[
                          styles.timelineNode,
                          isCompleted && styles.timelineNodeCompleted,
                          isActive && styles.timelineNodeActive,
                        ]}
                      >
                        {isCompleted ? (
                          <Feather name="check" size={12} color="#FFFFFF" />
                        ) : isActive ? (
                          <View style={styles.nodePulseInner} />
                        ) : (
                          <View style={styles.nodeQuietInner} />
                        )}
                      </View>
                      {index < JOURNEY_PHASES.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            isCompleted && styles.timelineLineCompleted,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.milestoneContentCol}>
                      <View style={styles.milestoneTitleRow}>
                        <Text style={[styles.milestonePhaseText, (isActive || isCompleted) && { color: '#040E34' }]}>
                          {phase}
                        </Text>
                        <View style={[styles.statusBadge, isCompleted ? styles.badgeCompleted : isActive ? styles.badgeActive : styles.badgeUpcoming]}>
                           <Text style={[styles.statusBadgeText, isCompleted ? styles.badgeTextCompleted : isActive ? styles.badgeTextActive : styles.badgeTextUpcoming]}>
                             {isCompleted ? 'COMPLETED' : isActive ? 'IN PROGRESS' : 'LOCKED'}
                           </Text>
                        </View>
                      </View>
                      {milestone?.title && (
                        <Text style={styles.milestoneTitleText}>{milestone.title}</Text>
                      )}
                      {milestone?.date && (
                        <Text style={styles.milestoneDateText}>{milestone.date}</Text>
                      )}
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#040E34', letterSpacing: -0.5 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  progressHeroCard: {
    backgroundColor: '#040E34',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroTextCol: { flex: 1, flexShrink: 1, minWidth: 0, paddingRight: 8 },
  heroBadge: { fontSize: 11, fontWeight: '800', color: '#D4AF37', letterSpacing: 1.5, marginBottom: 8 },
  heroNumberRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  heroNumber: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  heroPhaseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 4,
    letterSpacing: 0.8,
    flexWrap: 'wrap',
  },
  progWeekPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  progWeekText: { fontSize: 10, fontWeight: '700', color: '#D4AF37' },
  supportMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  supportMetricItem: { alignItems: 'center', flex: 1 },
  supportMetricValue: { fontSize: 24, fontWeight: '800', color: '#040E34', marginTop: 8 },
  supportMetricLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginTop: 4 },
  supportDivider: { width: 1, height: 40, backgroundColor: '#F1F5F9' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#040E34', letterSpacing: 1.5, marginBottom: 16 },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  timelineItemRow: { flexDirection: 'row', minHeight: 72 },
  nodeColumn: { alignItems: 'center', width: 24, marginRight: 16 },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeCompleted: { backgroundColor: '#040E34', borderColor: '#040E34' },
  timelineNodeActive: { borderColor: '#D4AF37', backgroundColor: '#FFFFFF' },
  nodePulseInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4AF37' },
  nodeQuietInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#F1F5F9', marginVertical: -2, zIndex: 1 },
  timelineLineCompleted: { backgroundColor: '#040E34' },
  milestoneContentCol: { flex: 1, paddingBottom: 24 },
  milestoneTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  milestonePhaseText: { fontSize: 14, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  milestoneTitleText: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 2 },
  milestoneDateText: { fontSize: 12, color: '#94A3B8' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  badgeCompleted: { backgroundColor: '#F1F5F9' },
  badgeActive: { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  badgeUpcoming: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F1F5F9' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  badgeTextCompleted: { color: '#64748B' },
  badgeTextActive: { color: '#D4AF37' },
  badgeTextUpcoming: { color: '#CBD5E1' },
});
