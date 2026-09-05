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
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AnimatedNumberCounter } from '../../components/animations/AnimatedNumberCounter';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { AsyncStateView } from '../../components/common/AsyncStateView';

import { activityService } from '../../services';
import { ActivitySession, ActivitySummary, ActivityType } from '../../types/domain';
import { Surface } from '../../context/SurfaceContext';

const FILTER_TABS: { label: string; value: 'all' | ActivityType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Walking', value: 'walking' },
  { label: 'Running', value: 'running' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Swimming', value: 'swimming' },
  { label: 'Strength', value: 'strength' },
];

const DISCIPLINE_COLORS: Record<string, string> = {
  walking: '#0EA5E9',
  running: '#F59E0B',
  cycling: '#10B981',
  swimming: '#3B82F6',
  strength: '#8B5CF6',
};

export default function ActivityScreen() {
  const { user } = useAuth();
  useScreenAnnouncement('Activity and Cardio screen.');

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

  const getActivityIcon = (type: string, color: string) => {
    switch (type) {
      case 'walking': return <MaterialCommunityIcons name="shoe-sneaker" size={24} color={color} />;
      case 'running': return <MaterialCommunityIcons name="run" size={24} color={color} />;
      case 'cycling': return <MaterialCommunityIcons name="bike" size={24} color={color} />;
      case 'swimming': return <MaterialCommunityIcons name="swim" size={24} color={color} />;
      case 'strength': default: return <MaterialCommunityIcons name="dumbbell" size={24} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Text style={styles.headerSubtitle}>Cross-discipline movement logs</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AsyncStateView loading={loading} error={error} onRetry={loadActivityData}>
          
          <CardSpringEntry index={0}>
            <Surface type="dark">
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <Text style={styles.heroBadge}>WEEKLY MOVEMENT</Text>
                  <View style={styles.gpsSyncPill}>
                    <View style={styles.gpsDot} />
                    <Text style={styles.gpsText}>MANUAL & GUIDED LOGS</Text>
                  </View>
                </View>

                <View style={styles.heroMetricRow}>
                  {summary?.activeMinutes == null ? (
                    <Text style={[styles.heroMinutesNumber, { fontSize: 36 }]}>—</Text>
                  ) : (
                    <AnimatedNumberCounter value={summary.activeMinutes} surface="dark" style={styles.heroMinutesNumber} />
                  )}
                  <View style={styles.heroMinutesLabelCol}>
                    <Text style={styles.heroMinutesLabel}>ACTIVE</Text>
                    <Text style={styles.heroMinutesLabelBold}>MINUTES</Text>
                    <Text style={styles.heroTimeframe}>This Week</Text>
                  </View>
                </View>

                <View style={styles.heroSubMetricsRow}>
                  <View style={styles.subMetricItem}>
                    <Text style={styles.subMetricVal}>{summary?.sessionsCount ?? 0}</Text>
                    <Text style={styles.subMetricLab}>SESSIONS</Text>
                  </View>
                  <View style={styles.subMetricDivider} />
                  <View style={styles.subMetricItem}>
                    <Text style={styles.subMetricVal}>
                      {summary?.activeCalories == null ? '—' : summary.activeCalories}
                    </Text>
                    <Text style={styles.subMetricLab}>CALORIES*</Text>
                  </View>
                  <View style={styles.subMetricDivider} />
                  <View style={styles.subMetricItem}>
                    <Text style={[styles.subMetricVal, { color: '#00C8FF' }]}>
                      {summary?.totalDistanceKm == null ? '—' : summary.totalDistanceKm}
                    </Text>
                    <Text style={styles.subMetricLab}>DISTANCE KM</Text>
                  </View>
                </View>
                <Text style={styles.calorieNote}>
                  *Calories shown only when measured with a documented method.
                </Text>
              </View>
            </Surface>
          </CardSpringEntry>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsRow}>
            {FILTER_TABS.map((tab) => {
              const isActive = selectedFilter === tab.value;
              return (
                <ScalePressable
                  key={tab.value}
                  onPress={() => setSelectedFilter(tab.value)}
                  style={[styles.filterTabPill, isActive && styles.filterTabPillActive]}
                >
                  <Text style={[styles.filterTabPillText, isActive && styles.filterTabPillTextActive]}>
                    {tab.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>
            {selectedFilter === 'all' ? 'RECENT LOGS' : `${selectedFilter.toUpperCase()} SESSIONS`}
          </Text>

          {filteredSessions.length === 0 ? (
            <View style={styles.emptyFilteredContainer}>
              <Text style={styles.emptyFilteredText}>No {selectedFilter} sessions recorded yet.</Text>
            </View>
          ) : (
            filteredSessions.map((item, index) => {
              const isExpanded = expandedSessionId === item.id;
              const disciplineColor = DISCIPLINE_COLORS[item.type] || '#64748B';

              return (
                <CardSpringEntry key={item.id} index={index + 1}>
                  <ScalePressable
                    activeScale={0.98}
                    onPress={() => setExpandedSessionId(isExpanded ? null : item.id)}
                    style={[styles.activityCard, { borderLeftColor: disciplineColor }]}
                  >
                    <View style={styles.activityMainRow}>
                      <View style={[styles.iconBox, { backgroundColor: `${disciplineColor}15` }]}>
                        {getActivityIcon(item.type, disciplineColor)}
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
                        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" style={{ marginLeft: 8 }} />
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedSessionDetails}>
                        <View style={styles.expandedDivider} />
                        <View style={styles.sessionMetaRow}>
                          <Text style={styles.sessionDetailLabel}>Logged Time:</Text>
                          <Text style={styles.sessionDetailVal}>{item.timestamp}</Text>
                        </View>
                        {item.intensity && (
                          <View style={styles.sessionMetaRow}>
                            <Text style={styles.sessionDetailLabel}>Target Intensity:</Text>
                            <Text style={styles.sessionDetailVal}>{item.intensity.toUpperCase()}</Text>
                          </View>
                        )}
                        {item.session_type && (
                          <View style={styles.sessionMetaRow}>
                            <Text style={styles.sessionDetailLabel}>Discipline Mode:</Text>
                            <Text style={styles.sessionDetailVal}>{item.session_type.replace(/_/g, ' ')}</Text>
                          </View>
                        )}
                      </View>
                    )}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '500' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#0F172A', borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heroBadge: { fontSize: 11, fontWeight: '800', color: '#00C8FF', letterSpacing: 1.2 },
  gpsSyncPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 200, 255, 0.15)',
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 200, 255, 0.3)'
  },
  gpsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C8FF', marginRight: 6 },
  gpsText: { fontSize: 9, fontWeight: '800', color: '#00C8FF', letterSpacing: 0.8 },
  heroMetricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroMinutesNumber: { fontSize: 56, fontWeight: '800', color: '#FFFFFF', letterSpacing: -2, lineHeight: 60 },
  heroMinutesLabelCol: { marginLeft: 16, justifyContent: 'center' },
  heroMinutesLabel: { fontSize: 13, fontWeight: '700', color: '#CBD5E1', letterSpacing: 1.5 },
  heroMinutesLabelBold: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  heroTimeframe: { fontSize: 11, fontWeight: '600', color: '#00C8FF', marginTop: 4 },
  heroSubMetricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1E293B' },
  subMetricItem: { alignItems: 'center', flex: 1 },
  subMetricVal: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  subMetricLab: { fontSize: 10, fontWeight: '700', color: '#CBD5E1', letterSpacing: 1, marginTop: 4 },
  subMetricDivider: { width: 1, height: 24, backgroundColor: '#1E293B' },
  calorieNote: { fontSize: 10, color: '#94A3B8', marginTop: 10 },
  filterTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, paddingVertical: 4 },
  filterTabPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterTabPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterTabPillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  filterTabPillTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', letterSpacing: 1.5, marginBottom: 16 },
  activityCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12,
    borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  activityMainRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoCol: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  itemMeta: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  calCol: { flexDirection: 'row', alignItems: 'center' },
  calBadge: { backgroundColor: '#F8FAFC', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  calText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  expandedSessionDetails: { marginTop: 16 },
  expandedDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  sessionMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sessionDetailLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  sessionDetailVal: { fontSize: 12, color: '#0F172A', fontWeight: '700' },
  emptyFilteredContainer: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyFilteredText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
});
