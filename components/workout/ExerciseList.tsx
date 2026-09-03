import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { Colors } from '../../constants/colors';
import { Exercise } from '../../types/domain';
import { ExerciseCard } from './ExerciseCard';

interface ExerciseListProps {
  exercises?: Exercise[];
  activeExerciseId?: string;
  completedExerciseIds?: string[];
  onSelectExercise: (exercise: Exercise) => void;
  title?: string;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  activeExerciseId,
  completedExerciseIds = [],
  onSelectExercise,
  title = "PRESCRIBED EXERCISES",
}) => {
  if (!exercises || exercises.length === 0) return null;

  return (
    <View style={styles.container} accessible={true} accessibilityRole="list">
      <View style={styles.headerRow} accessible={true} accessibilityRole="header">
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.countBadge}>{exercises.length} MOVEMENTS</Text>
      </View>

      {exercises.map((ex, index) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          index={index}
          isActive={activeExerciseId === ex.id}
          isCompleted={completedExerciseIds.includes(ex.id)}
          onSelect={() => onSelectExercise(ex)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: 1,
  },
  countBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E9FA9',
    letterSpacing: 0.8,
  },
});
