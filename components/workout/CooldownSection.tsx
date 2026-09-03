import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../animations/ScalePressable';

interface CooldownSectionProps {
  cooldown?: string[];
  durationMinutes?: number;
}

export const CooldownSection: React.FC<CooldownSectionProps> = ({
  cooldown,
  durationMinutes = 3,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!cooldown || cooldown.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScalePressable
        activeScale={0.98}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`Cooldown. ${durationMinutes} minutes. ${expanded ? 'Expanded. Double tap to collapse' : 'Collapsed. Double tap to view details'}.`}
        accessibilityHint="Toggles cooldown and mobility instructions"
        accessibilityState={{ expanded }}
        style={styles.headerPressable}
      >
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Feather name="wind" size={14} color="#059669" />
          </View>
          <View>
            <Text style={styles.title}>Cooldown</Text>
            <Text style={styles.subtitle}>{durationMinutes} min • Recovery & Stretches</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionText}>
            {expanded ? 'Hide cooldown' : 'View cooldown'}
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-right'}
            size={16}
            color="#059669"
            style={{ marginLeft: 4 }}
          />
        </View>
      </ScalePressable>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          {cooldown.map((step, idx) => (
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
    backgroundColor: '#F0FDF4',
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    color: '#065F46',
  },
  subtitle: {
    ...Typography.caption,
    color: '#047857',
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
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#BBF7D0',
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
    color: '#059669',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
  },
  itemText: {
    ...Typography.bodySmall,
    color: '#064E3B',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
