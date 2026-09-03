import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { UniFitFeature } from '../../constants/features';

export interface FeatureItemProps {
  feature: UniFitFeature;
  index: number;
  style?: ViewStyle;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({
  feature,
  index,
  style,
}) => {
  return (
    <View
      style={[styles.card, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${feature.title}. ${feature.description}`}
    >
      <View style={styles.headerRow} accessible={false} importantForAccessibility="no">
        <View style={styles.iconContainer} accessible={false}>
          <Feather name={feature.iconName} size={22} color={Colors.primary} />
        </View>

        <View style={styles.badgeContainer} accessible={false}>
          <Text style={styles.badgeText}>{feature.badge}</Text>
        </View>
      </View>

      <Text style={styles.title} accessible={false}>{feature.title}</Text>
      <Text style={styles.description} accessible={false}>{feature.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Layout.spacing.xs + 2,
  },
  description: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
