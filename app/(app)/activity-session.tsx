import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { activityLogService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { getAppToday, formatDateISO } from '../../utils/date';
import { operationIdFromParts } from '../../utils/operationId';
import { ActivityType } from '../../types/domain';

const INSTRUCTIONS: Record<string, string> = {
  walking:
    'Walk at a brisk, comfortable pace. Keep your posture tall, swing your arms, and stay hydrated.',
  running:
    'Warm up with easy movement, then run at a steady effort you can keep for the session. Slow down before stopping.',
  cycling:
    'Pedal at a steady rhythm. Adjust resistance so you can keep a consistent cadence and breathing.',
  swimming:
    'Swim continuous laps at your own pace. Use a safe pool with support available if needed.',
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActivitySessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    mode?: string;
  }>();
  const { user } = useAuth();
  const initialType: ActivityType =
    params.type === 'swimming' ||
    params.type === 'cycling' ||
    params.type === 'running' ||
    params.type === 'walking'
      ? params.type
      : 'walking';
  const [activityType, setActivityType] = useState<ActivityType>(initialType);
  const manual = params.mode !== 'guided';

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [distance, setDistance] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const accumulatedRef = useRef(0);
  const startedAtRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = () => {
    const start = new Date().toISOString();
    startedAtRef.current = start;
    setStartedAt(start);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(accumulatedRef.current + Math.floor((Date.now() - new Date(start).getTime()) / 1000));
    }, 1000);
  };

  const pauseTimer = () => {
    if (!startedAtRef.current) return;
    accumulatedRef.current += Math.floor(
      (Date.now() - new Date(startedAtRef.current).getTime()) / 1000
    );
    stopTimer();
  };

  const save = async (completed: boolean) => {
    const durationSeconds = manual
      ? Math.round(Number(minutesInput || 0) * 60)
      : accumulatedRef.current + (running && startedAtRef.current
          ? Math.floor((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
          : 0);
    const distanceKm = distance.trim() ? Number(distance.trim()) : undefined;
    if (manual && !minutesInput.trim() && !distance.trim()) {
      Alert.alert('Enter duration or distance', 'Add at least one measured value before saving.');
      return;
    }
    setSaving(true);
    try {
      await activityLogService.create({
        activity_type: activityType,
        local_date: formatDateISO(getAppToday()),
        source: manual ? 'manual' : 'guided',
        operation_id: operationIdFromParts(
          user?.id,
          activityType,
          manual ? 'manual' : startedAtRef.current || 'guided'
        ),
        started_at: startedAtRef.current || undefined,
        ended_at: new Date().toISOString(),
        active_duration_seconds: durationSeconds,
        duration_minutes: durationSeconds / 60,
        distance_km: distanceKm && distanceKm > 0 ? distanceKm : undefined,
        distance_entered: Boolean(distance.trim()),
        completed,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert(
        'Could not save activity',
        'Check your connection. Your session is not lost — retry saving before leaving.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{activityType.toUpperCase()}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.typeRow}>
          {(['walking', 'running', 'cycling', 'swimming'] as ActivityType[]).map(
            (item) => (
              <Pressable
                key={item}
                onPress={() => setActivityType(item)}
                style={[styles.typeChip, item === activityType && styles.typeChipActive]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    item === activityType && styles.typeChipTextActive,
                  ]}
                >
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            )
          )}
        </View>
        <Text style={styles.guidance}>{INSTRUCTIONS[activityType]}</Text>

        {manual ? (
          <View style={styles.manualCard}>
            <Text style={styles.cardTitle}>MANUAL ENTRY</Text>
            <TextInput
              value={minutesInput}
              onChangeText={setMinutesInput}
              keyboardType="numeric"
              placeholder="Duration (minutes)"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TextInput
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
              placeholder="Distance (km) — optional"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.notesInput]}
            />
            <Pressable
              onPress={() => void save(true)}
              disabled={saving}
              style={[styles.saveButton, saving && styles.disabled]}
            >
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Entry'}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>{running ? 'IN SESSION' : elapsed > 0 ? 'PAUSED' : 'READY'}</Text>
              <Text style={styles.timerText}>{formatClock(elapsed)}</Text>
              <View style={styles.timerActions}>
                {!running ? (
                  <Pressable
                    onPress={elapsed > 0 ? pauseTimer : startTimer}
                    style={styles.timerPrimary}
                  >
                    <Text style={styles.timerPrimaryText}>{elapsed > 0 ? 'Resume' : 'Start'}</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={pauseTimer} style={styles.timerSecondary}>
                    <Text style={styles.timerSecondaryText}>Pause</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <TextInput
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
              placeholder="Distance (km) — optional"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.notesInput]}
            />
            <View style={styles.finishRow}>
              <Pressable onPress={() => void save(false)} disabled={saving || elapsed === 0} style={[styles.finishPartial, (saving || elapsed === 0) && styles.disabled]}>
                <Text style={styles.finishPartialText}>Save Partial</Text>
              </Pressable>
              <Pressable onPress={() => void save(true)} disabled={saving || elapsed === 0} style={[styles.finish, (saving || elapsed === 0) && styles.disabled]}>
                <Text style={styles.finishText}>Finish</Text>
              </Pressable>
            </View>
          </>
        )}

        <Text style={styles.note}>
          Calories are shown only when measured with a documented method. Distance is only what you enter.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  content: { padding: 20, gap: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  typeChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  typeChipText: { color: '#CBD5E1', fontSize: 12, fontWeight: '800' },
  typeChipTextActive: { color: '#FFFFFF' },
  guidance: { color: '#CBD5E1', fontSize: 15, lineHeight: 22 },
  manualCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: '#0EA5E9', letterSpacing: 1.2, marginBottom: 12 },
  timerCard: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 32, alignItems: 'center' },
  timerLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 1.5 },
  timerText: { fontSize: 56, fontWeight: '800', color: '#0F172A', letterSpacing: -2, marginVertical: 8, fontVariant: ['tabular-nums'] },
  timerActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  timerPrimary: { backgroundColor: '#0EA5E9', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  timerPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  timerSecondary: { backgroundColor: '#F1F5F9', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  timerSecondaryText: { color: '#334155', fontWeight: '800' },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0F172A', minHeight: 46,
  },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  finishRow: { flexDirection: 'row', gap: 10 },
  finishPartial: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  finishPartialText: { color: '#FFFFFF', fontWeight: '800' },
  finish: { flex: 1, backgroundColor: '#0EA5E9', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  finishText: { color: '#FFFFFF', fontWeight: '800' },
  saveButton: { backgroundColor: '#0EA5E9', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#FFFFFF', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  note: { color: '#64748B', fontSize: 12, lineHeight: 18 },
});
