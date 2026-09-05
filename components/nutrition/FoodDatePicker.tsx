import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface FoodDatePickerProps {
  visible: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export const FoodDatePicker: React.FC<FoodDatePickerProps> = ({
  visible,
  selectedDate,
  onSelect,
  onClose,
}) => {
  const parsed = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return { y: y || new Date().getFullYear(), m: (m || new Date().getMonth() + 1) - 1, d: d || new Date().getDate() };
  }, [selectedDate]);
  const [year, setYear] = useState(parsed.y);
  const [month, setMonth] = useState(parsed.m);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const cells: Array<string | null> = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    const count = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= count; day++) {
      cells.push(
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      );
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const shiftMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.nav} accessibilityRole="button" accessibilityLabel="Previous month">
            <Feather name="chevron-left" size={18} color="#0F172A" />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTHS[month]} {year}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.nav} accessibilityRole="button" accessibilityLabel="Next month">
            <Feather name="chevron-right" size={18} color="#0F172A" />
          </Pressable>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close calendar">
            <Feather name="x" size={18} color="#64748B" />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((label, idx) => (
            <Text key={idx} style={styles.weekday}>{label}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {grid.map((dateKey, idx) =>
            dateKey ? (
              <Pressable
                key={dateKey}
                onPress={() => {
                  onSelect(dateKey);
                  onClose();
                }}
                style={[
                  styles.day,
                  dateKey === selectedDate && styles.daySelected,
                ]}
              >
                <Text style={[styles.dayText, dateKey === selectedDate && styles.dayTextSelected]}>
                  {Number(dateKey.slice(8, 10))}
                </Text>
              </Pressable>
            ) : (
              <View key={`empty-${idx}`} style={styles.day} />
            )
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#0F172A' },
  nav: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: '#0EA5E9', borderRadius: 999 },
  dayText: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  dayTextSelected: { color: '#FFFFFF' },
});
