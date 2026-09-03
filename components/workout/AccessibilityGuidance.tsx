import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../animations/ScalePressable';

interface AccessibilityGuidanceProps {
  guidance?: string;
}

export const AccessibilityGuidance: React.FC<AccessibilityGuidanceProps> = ({ guidance }) => {
  const [expanded, setExpanded] = useState(false);

  if (!guidance) return null;

  return (
    <View style={styles.container}>
      <ScalePressable
        activeScale={0.98}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`Guidance available. ${expanded ? 'Expanded. Double tap to collapse' : 'Collapsed. Double tap to view guidance'}.`}
        accessibilityHint="Toggles inclusive setup, audio cues, and balance guidance"
        accessibilityState={{ expanded }}
        style={styles.headerPressable}
      >
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Feather name="volume-2" size={14} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Guidance available</Text>
            <Text style={styles.subtitle}>Audio & visual accommodations</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionText}>
            {expanded ? 'Hide guidance' : 'View guidance'}
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
          <Text style={styles.body}>{guidance}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: '#1E40AF',
  },
  subtitle: {
    ...Typography.caption,
    color: '#3B82F6',
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
    backgroundColor: '#BFDBFE',
    marginBottom: Layout.spacing.sm,
  },
  expandedContent: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    paddingTop: 0,
  },
  body: {
    ...Typography.bodySmall,
    color: '#1E3A8A',
    lineHeight: 20,
    fontSize: 13,
  },
});
