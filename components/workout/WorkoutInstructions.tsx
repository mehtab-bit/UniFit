import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../animations/ScalePressable';

interface WorkoutInstructionsProps {
  instructions?: string;
}

export const WorkoutInstructions: React.FC<WorkoutInstructionsProps> = ({ instructions }) => {
  const [expanded, setExpanded] = useState(false);

  if (!instructions) return null;

  return (
    <View style={styles.container}>
      <ScalePressable
        activeScale={0.98}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`Coaching tips. ${expanded ? 'Expanded. Double tap to collapse' : 'Collapsed. Double tap to view instructions'}.`}
        accessibilityHint="Toggles workout coaching tips and instructions"
        accessibilityState={{ expanded }}
        style={styles.headerPressable}
      >
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Feather name="book-open" size={14} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Coaching tips</Text>
            <Text style={styles.subtitle}>Technique, breathing & tempo</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionText}>
            {expanded ? 'Hide tips' : 'View instructions'}
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-right'}
            size={16}
            color={Colors.primary}
            style={{ marginLeft: 4 }}
          />
        </View>
      </ScalePressable>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <Text style={styles.body}>{instructions}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.spacing.sm + 4,
    overflow: 'hidden',
  },
  headerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.sm + 2,
    paddingHorizontal: Layout.spacing.md,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Layout.spacing.sm,
  },
  expandedContent: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    paddingTop: 0,
  },
  body: {
    ...Typography.bodySmall,
    color: Colors.text,
    lineHeight: 20,
    fontSize: 13,
  },
});
