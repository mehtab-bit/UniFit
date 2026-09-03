import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface WorkoutMetaProps {
  durationMinutes?: number;
  distanceKm?: number;
  equipment?: string;
  intervalCount?: number;
  workInterval?: string;
  recoveryInterval?: string;
  sets?: number;
  reps?: number;
}

export const WorkoutMeta: React.FC<WorkoutMetaProps> = ({
  durationMinutes,
  distanceKm,
  equipment,
  intervalCount,
  workInterval,
  recoveryInterval,
  sets,
  reps,
}) => {
  const hasMeta =
    durationMinutes ||
    distanceKm ||
    equipment ||
    intervalCount ||
    workInterval ||
    sets;

  if (!hasMeta) return null;

  return (
    <View style={styles.container} accessible={true} accessibilityRole="summary" accessibilityLabel="Workout parameters">
      <View style={styles.grid}>
        {durationMinutes && durationMinutes > 0 ? (
          <View style={styles.metaItem}>
            <View style={styles.iconBox}>
              <Feather name="clock" size={15} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{durationMinutes} min</Text>
            </View>
          </View>
        ) : null}

        {distanceKm ? (
          <View style={styles.metaItem}>
            <View style={styles.iconBox}>
              <Feather name="map-pin" size={15} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.metaLabel}>Distance</Text>
              <Text style={styles.metaValue}>{distanceKm} km</Text>
            </View>
          </View>
        ) : null}

        {sets ? (
          <View style={styles.metaItem}>
            <View style={styles.iconBox}>
              <Feather name="repeat" size={15} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Volume</Text>
              <Text style={styles.metaValue}>
                {sets} sets {reps ? `• ${reps} reps` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {intervalCount ? (
          <View style={styles.metaItem}>
            <View style={styles.iconBox}>
              <Feather name="zap" size={15} color="#D97706" />
            </View>
            <View>
              <Text style={styles.metaLabel}>Intervals</Text>
              <Text style={styles.metaValue}>{intervalCount} intervals</Text>
            </View>
          </View>
        ) : null}
      </View>

      {equipment ? (
        <View style={styles.equipmentRow}>
          <MaterialCommunityIcons name="toolbox-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.equipmentLabel}>Equipment: </Text>
          <Text style={styles.equipmentValue}>{equipment}</Text>
        </View>
      ) : null}

      {workInterval && recoveryInterval ? (
        <View style={styles.intervalDetailsBox}>
          <View style={styles.intervalDetailCol}>
            <Text style={styles.intervalHeader}>WORK PHASE</Text>
            <Text style={styles.intervalText}>{workInterval}</Text>
          </View>
          <View style={styles.intervalDivider} />
          <View style={styles.intervalDetailCol}>
            <Text style={styles.intervalHeader}>RECOVERY PHASE</Text>
            <Text style={styles.intervalText}>{recoveryInterval}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metaLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: Colors.text,
    fontSize: 13,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  equipmentLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontSize: 11,
  },
  equipmentValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text,
    fontSize: 11,
  },
  intervalDetailsBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  intervalDetailCol: {
    flex: 1,
  },
  intervalHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  intervalText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text,
    fontSize: 12,
  },
  intervalDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
});
