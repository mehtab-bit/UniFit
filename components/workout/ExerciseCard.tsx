import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
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
  const [expanded, setExpanded] = useState(false);
  const [showSecondaryInfo, setShowSecondaryInfo] = useState(false);

  const cues = (exercise.formCues || []).slice(0, 3);

  return (
    <View
      style={[
        styles.rowContainer,
        isActive && styles.rowActive,
        isCompleted && styles.rowCompleted,
      ]}
    >
      {/* Sleek Exercise Row */}
      <ScalePressable
        activeScale={0.99}
        onPress={() => {
          onSelect();
          setExpanded(!expanded);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.name}. ${exercise.target}. ${exercise.sets || 2} sets of ${exercise.reps || 8} reps. Rest ${exercise.restSeconds || 70} seconds. ${isActive ? 'Currently active' : ''}. Double tap to ${expanded ? 'collapse' : 'view'} details.`}
        accessibilityState={{ selected: isActive, expanded }}
        style={styles.mainPressableRow}
      >
        {/* Status Indicator Icon */}
        <View style={styles.indicatorCol}>
          {isCompleted ? (
            <View style={styles.completedCircle}>
              <Feather name="check" size={13} color="#FFFFFF" />
            </View>
          ) : isActive ? (
            <View style={styles.activeCircle}>
              <View style={styles.activeInnerDot} />
            </View>
          ) : (
            <View style={styles.quietCircle}>
              <Text style={styles.indexNumber}>{index + 1}</Text>
            </View>
          )}
        </View>

        {/* Center: Name & Target Muscles */}
        <View style={styles.infoCol}>
          <Text style={[styles.exerciseName, isActive && styles.exerciseNameActive]}>
            {exercise.name.toUpperCase()}
          </Text>
          <Text style={styles.exerciseTarget} numberOfLines={1}>
            {exercise.target.replace(/&/g, '·')}
          </Text>
        </View>

        {/* Right: Sets × Reps and Rest */}
        <View style={styles.specsCol}>
          <Text style={[styles.setsRepsText, isActive && styles.setsRepsTextActive]}>
            {exercise.sets || 2} × {exercise.reps || 8}
          </Text>
          <Text style={styles.restText}>{exercise.restSeconds || 70}s rest</Text>
        </View>

        {/* Subtle Chevron */}
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={isActive ? Colors.primary : Colors.textMuted}
          style={{ marginLeft: 8 }}
        />
      </ScalePressable>

      {/* Expanded Exercise Detail (Progressive Disclosure) */}
      {expanded ? (
        <View style={styles.expandedDetailBox}>
          <View style={styles.detailDivider} />

          {/* Big Hero Stats */}
          <View style={styles.statsHeroRow}>
            <View style={styles.bigStatItem}>
              <Text style={styles.bigStatNumber}>
                {exercise.sets || 2} × {exercise.reps || 8}
              </Text>
              <Text style={styles.bigStatLabel}>SETS × REPS</Text>
            </View>

            <View style={styles.bigStatDivider} />

            <View style={styles.bigStatItem}>
              <Text style={styles.bigStatNumber}>{exercise.restSeconds || 70}s</Text>
              <Text style={styles.bigStatLabel}>REST INTERVAL</Text>
            </View>

            <View style={styles.bigStatDivider} />

            <View style={styles.bigStatItem}>
              <Text style={styles.bigStatNumber}>
                {(exercise.sets || 2) * (exercise.reps || 8)}
              </Text>
              <Text style={styles.bigStatLabel}>TOTAL REPS</Text>
            </View>
          </View>

          {/* Key Form Cues (2-3 short cues with check indicators) */}
          {cues.length > 0 ? (
            <View style={styles.formCuesContainer}>
              <Text style={styles.sectionHeading}>KEY FORM CUES</Text>
              {cues.map((cue, cIdx) => (
                <View key={cIdx} style={styles.cueItemRow}>
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={11} color={Colors.primary} />
                  </View>
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Secondary Info Toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowSecondaryInfo(!showSecondaryInfo)}
            accessibilityRole="button"
            accessibilityLabel="Technical instructions and setup accommodations"
            style={styles.secondaryToggleRow}
          >
            <Text style={styles.secondaryToggleText}>
              {showSecondaryInfo ? 'Hide technical setup' : 'View equipment & setup notes'}
            </Text>
            <Feather
              name={showSecondaryInfo ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {showSecondaryInfo ? (
            <View style={styles.secondaryContainer}>
              {exercise.equipment ? (
                <View style={styles.secondaryItem}>
                  <Text style={styles.secondaryLabel}>EQUIPMENT</Text>
                  <Text style={styles.secondaryValue}>{exercise.equipment}</Text>
                </View>
              ) : null}

              {exercise.instructions ? (
                <View style={styles.secondaryItem}>
                  <Text style={styles.secondaryLabel}>INSTRUCTIONS</Text>
                  <Text style={styles.secondaryValue}>{exercise.instructions}</Text>
                </View>
              ) : null}

              {exercise.accessibilityGuidance ? (
                <View style={styles.accessibilityItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Feather name="shield" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.accessibilityLabel}>ACCESSIBILITY GUIDANCE</Text>
                  </View>
                  <Text style={styles.accessibilityValue}>{exercise.accessibilityGuidance}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    overflow: 'hidden',
    ...Layout.shadows.subtle,
  },
  rowActive: {
    borderColor: '#2166BF',
    borderWidth: 1.5,
    backgroundColor: '#F8FBFF',
    ...Layout.shadows.card,
  },
  rowCompleted: {
    backgroundColor: '#FDFDFD',
    borderColor: '#E5E7EB',
    opacity: 0.9,
  },
  mainPressableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  indicatorCol: {
    marginRight: 12,
  },
  quietCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  indexNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2166BF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2166BF',
  },
  completedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: 0.3,
  },
  exerciseNameActive: {
    color: '#2166BF',
  },
  exerciseTarget: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  specsCol: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  setsRepsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#040E34',
  },
  setsRepsTextActive: {
    color: '#2166BF',
  },
  restText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  expandedDetailBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: '#F8FBFF',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  statsHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  bigStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  bigStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#040E34',
  },
  bigStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bigStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  formCuesContainer: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cueItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  cueText: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  secondaryToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  secondaryToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2166BF',
  },
  secondaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.md,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryItem: {
    marginBottom: 6,
  },
  secondaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  secondaryValue: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginTop: 1,
  },
  accessibilityItem: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: Layout.borderRadius.sm,
    marginTop: 2,
  },
  accessibilityLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2166BF',
    letterSpacing: 0.5,
  },
  accessibilityValue: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
  },
});
