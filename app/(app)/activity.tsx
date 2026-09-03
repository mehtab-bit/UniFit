import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AnimatedNumberCounter } from '../../components/animations/AnimatedNumberCounter';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Services & Domain Models
import { activityService } from '../../services';
import { ActivitySession, ActivitySummary, ActivityType } from '../../types/domain';

const FILTER_TABS: { label: string; value: 'all' | ActivityType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Walking', value: 'walking' },
  { label: 'Running', value: 'running' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Swimming', value: 'swimming' },
  { label: 'Strength', value: 'strength' },
];

export default function ActivityScreen() {
  const { user } = useAuth();
  useScreenAnnouncement('Activity and Cardio screen. Filter and inspect your cross-discipline workout logs.');

  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ActivityType>('all');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsRes, summaryRes] = await Promise.all([
        activityService.getRecentSessions(user?.id),
        activityService.getWeeklySummary(user?.id),
      ]);
      setSessions(sessionsRes);
      setSummary(summaryRes);
    } catch (err) {
      setError('Unable to load activity logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  const filteredSessions = useMemo(() => {
    if (selectedFilter === 'all') return sessions;
    return sessions.filter((s) => s.type === selectedFilter);
  }, [sessions, selectedFilter]);

  const getActivityIcon = (session: ActivitySession) => {
    switch (session.type) {
      case 'walking':
        return <MaterialCommunityIcons name="shoe-sneaker" size={22} color={session.color} />;
      case 'running':
        return <MaterialCommunityIcons name="run" size={22} color={session.color} />;
      case 'cycling':
        return <MaterialCommunityIcons name="bike" size={22} color={session.color} />;
      case 'swimming':
        return <MaterialCommunityIcons name="swim" size={22} color={session.color} />;
      case 'strength':
      default:
        return <MaterialCommunityIcons name="dumbbell" size={22} color={session.color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <Text style={styles.headerTitle}>Activity & Cardio</Text>
        <Text style={styles.headerSubtitle}>Cross-discipline movement logs</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadActivityData}>
          {/* Weekly Energetic Hero Card */}
          <CardSpringEntry index={0}>
            <View
              style={styles.activityHeroCard}
              accessible={true}
              accessibilityRole="summary"
              accessibilityLabel={`${summary?.activeMinutes || 117} active minutes this week. ${summary?.sessionsCount || 4} sessions. ${summary?.activeCalories || 915} active calories.`}
            >
              <View style={styles.heroTopRow}>
                <Text style={styles.heroBadge}>WEEKLY MOVEMENT</Text>
                <View style={styles.gpsSyncPill}>
                  <View style={styles.gpsDot} />
                  <Text style={styles.gpsText}>GPS & SENSORS</Text>
                </View>
              </View>

              {/* Dominant Hero Metric: 117 ACTIVE MINUTES */}
              <View style={styles.heroMetricRow}>
                <AnimatedNumberCounter
                  value={summary?.activeMinutes || 117}
                  style={styles.heroMinutesNumber}
                  accessibilityLabel={`${summary?.activeMinutes || 117} active minutes`}
                />
                <View style={styles.heroMinutesLabelCol}>
                  <Text style={styles.heroMinutesLabel}>ACTIVE</Text>
                  <Text style={styles.heroMinutesLabelBold}>MINUTES</Text>
                  <Text style={styles.heroTimeframe}>This Week</Text>
                </View>
              </View>

              {/* Supporting Secondary Metrics */}
              <View style={styles.heroSubMetricsRow}>
                <View style={styles.subMetricItem}>
                  <Text style={styles.subMetricVal}>{summary?.sessionsCount || 4}</Text>
                  <Text style={styles.subMetricLab}>SESSIONS</Text>
                </View>
                <View style={styles.subMetricDivider} />
                <View style={styles.subMetricItem}>
                  <Text style={styles.subMetricVal}>{summary?.activeCalories || 915}</Text>
                  <Text style={styles.subMetricLab}>ACTIVE KCAL</Text>
                </View>
                <View style={styles.subMetricDivider} />
                <View style={styles.subMetricItem}>
                  <Text style={[styles.subMetricVal, { color: '#00C8FF' }]}>100%</Text>
                  <Text style={styles.subMetricLab}>ADHERENCE</Text>
                </View>
              </View>
            </View>
          </CardSpringEntry>

          {/* Activity Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsRow}
            accessible={true}
            accessibilityRole="tablist"
            accessibilityLabel="Activity type filter tabs"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = selectedFilter === tab.value;
              return (
                <ScalePressable
                  key={tab.value}
                  onPress={() => setSelectedFilter(tab.value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filter by ${tab.label}`}
                  style={[
                    styles.filterTabPill,
                    isActive && styles.filterTabPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabPillText,
                      isActive && styles.filterTabPillTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </ScrollView>

          {/* Section Heading */}
          <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">
            {selectedFilter === 'all' ? 'RECENT SESSIONS' : `${selectedFilter.toUpperCase()} LOGS`}
          </Text>

          {/* Filtered Activity Sessions */}
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyFilteredContainer}>
              <Text style={styles.emptyFilteredText}>No {selectedFilter} sessions recorded yet.</Text>
            </View>
          ) : (
            filteredSessions.map((item, index) => {
              const isExpanded = expandedSessionId === item.id;
              return (
                <CardSpringEntry key={item.id} index={index + 1}>
                  <ScalePressable
                    activeScale={0.98}
                    onPress={() => setExpandedSessionId(isExpanded ? null : item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.duration}. ${item.distance ? `${item.distance}. ` : ''}${item.calories}. ${isExpanded ? 'Expanded. Double tap to collapse' : 'Collapsed. Double tap to view details'}.`}
                    accessibilityState={{ expanded: isExpanded }}
                    style={[styles.activityCard, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
                  >
                    <View style={styles.activityMainRow}>
                      <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]} accessible={false} importantForAccessibility="no">
                        {getActivityIcon(item)}
                      </View>

                      <View style={styles.infoCol}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemMeta}>
                          {item.duration} {item.distance ? `• ${item.distance}` : ''}
                        </Text>
                      </View>

                      <View style={styles.calCol}>
                        <View style={styles.calBadge}>
                          <Text style={styles.calText}>{item.calories}</Text>
                        </View>
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={15}
                          color={Colors.textSecondary}
                          style={{ marginLeft: 6 }}
                        />
                      </View>
                    </View>

                    {isExpanded ? (
                      <View style={styles.expandedSessionDetails}>
                        <View style={styles.expandedDivider} />
                        <View style={styles.sessionMetaRow}>
                          <Text style={styles.sessionDetailLabel}>Logged Time:</Text>
                          <Text style={styles.sessionDetailVal}>{item.timestamp}</Text>
                        </View>
                        {item.intensity ? (
                          <View style={styles.sessionMetaRow}>
                            <Text style={styles.sessionDetailLabel}>Target Intensity:</Text>
                            <Text style={styles.sessionDetailVal}>{item.intensity.toUpperCase()}</Text>
                          </View>
                        ) : null}
                        {item.session_type ? (
                          <View style={styles.sessionMetaRow}>
                            <Text style={styles.sessionDetailLabel}>Discipline Mode:</Text>
                            <Text style={styles.sessionDetailVal}>{item.session_type.replace(/_/g, ' ')}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </ScalePressable>
                </CardSpringEntry>
              );
            })
          )}
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
    paddingBottom: Layout.spacing.xl,
  },
  activityHeroCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#07328D',
    ...Layout.shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 1,
  },
  gpsSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 255, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.3)',
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C8FF',
    marginRight: 5,
  },
  gpsText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 0.8,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroMinutesNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  heroMinutesLabelCol: {
    marginLeft: 14,
    justifyContent: 'center',
  },
  heroMinutesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9FA9',
    letterSpacing: 1,
    lineHeight: 14,
  },
  heroMinutesLabelBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    lineHeight: 16,
  },
  heroTimeframe: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C8FF',
    marginTop: 2,
  },
  heroSubMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  subMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  subMetricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subMetricLab: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9E9FA9',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  subMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: Layout.spacing.md,
  },
  filterTabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabPillText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTabPillTextActive: {
    color: Colors.textInverse,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark,
    marginBottom: Layout.spacing.md,
  },
  activityCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.sm,
    ...Layout.shadows.subtle,
  },
  activityMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.text,
    fontSize: 14,
    marginBottom: 2,
  },
  itemMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  calCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calBadge: {
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.md,
  },
  calText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 11,
  },
  expandedSessionDetails: {
    marginTop: Layout.spacing.sm,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionDetailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  sessionDetailVal: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 11,
  },
  emptyFilteredContainer: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilteredText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
});
