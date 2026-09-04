import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { Exercise } from '../../types/domain';
import { ScalePressable } from '../animations/ScalePressable';

interface ExerciseCardProps {
  exercise: Exercise;
  isActive?: boolean;
  isCompleted?: boolean;
  onSelect: () => void;
  index?: number;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isActive = false,
  isCompleted = false,
  onSelect,
  index = 0,
}) => {
  const displayIndex = (index + 1).toString().padStart(2, '0');
  const repsText =
    exercise.sets && exercise.reps ? `${exercise.sets}×${exercise.reps}` : '—';
  const restText =
    exercise.restSeconds != null ? `${exercise.restSeconds}sec` : '';

  return (
    <ScalePressable
      activeScale={0.99}
      onPress={onSelect}
      accessibilityRole="button"
      style={[
        styles.container,
        isActive && styles.activeContainer,
        isCompleted && styles.completedContainer,
      ]}
    >
      <View style={styles.leftGroup}>
        <Text style={[styles.indexText, isActive && styles.activeIndex]}>
          {displayIndex}
        </Text>
        <Text style={[styles.nameText, isActive && styles.activeName]}>
          {exercise.name.toUpperCase()}
        </Text>
      </View>
      <View style={styles.rightGroup}>
        <Text style={[styles.metaText, isActive && styles.activeMeta]}>
          {repsText} {restText}
        </Text>
      </View>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
  },
  activeContainer: {
    backgroundColor: '#000000',
    borderRadius: Layout.borderRadius.md,
    borderBottomWidth: 0,
    marginVertical: 4,
    ...Layout.shadows.card,
  },
  completedContainer: {
    opacity: 0.5,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A1A1AA',
    marginRight: 16,
    fontVariant: ['tabular-nums'],
  },
  activeIndex: {
    color: '#00C8FF',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#27272A',
    letterSpacing: 1,
  },
  activeName: {
    color: '#FFFFFF',
  },
  rightGroup: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  activeMeta: {
    color: '#CBD5E1',
  },
});

