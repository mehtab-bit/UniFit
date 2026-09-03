import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../animations/ScalePressable';

interface WarmupSectionProps {
  warmUp?: string[];
  durationMinutes?: number;
}

export const WarmupSection: React.FC<WarmupSectionProps> = ({
  warmUp,
  durationMinutes = 3,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!warmUp || warmUp.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScalePressable
        activeScale={0.98}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`Warm-up. ${durationMinutes} minutes. ${expanded ? 'Expanded. Double tap to collapse' : 'Collapsed. Double tap to view details'}.`}
        accessibilityHint="Toggles warm-up exercise instructions"
        accessibilityState={{ expanded }}
        style={styles.headerPressable}
      >
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Feather name="sun" size={14} color="#D97706" />
          </View>
          <View>
            <Text style={styles.title}>Warm-up</Text>
            <Text style={styles.subtitle}>{durationMinutes} min • Preparation</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionText}>
            {expanded ? 'Hide warm-up' : 'View warm-up'}
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-right'}
            size={16}
            color="#D97706"
            style={{ marginLeft: 4 }}
          />
        </View>
      </ScalePressable>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          {warmUp.map((step, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.itemText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF9E7',
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    color: '#92400E',
  },
  subtitle: {
    ...Typography.caption,
    color: '#B45309',
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
    color: '#D97706',
  },
  divider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginBottom: Layout.spacing.sm,
  },
  expandedContent: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    paddingTop: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
  },
  itemText: {
    ...Typography.bodySmall,
    color: '#78350F',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
