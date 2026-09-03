import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface SelectableCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  isMultiSelect?: boolean;
  iconName?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  title,
  description,
  selected,
  onSelect,
  isMultiSelect = false,
  iconName,
  disabled = false,
  style,
}) => {
  const role = isMultiSelect ? 'checkbox' : 'radio';
  const a11yHint = `Double tap to ${selected ? 'unselect' : 'select'} ${title}`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      disabled={disabled}
      accessible={true}
      accessibilityRole={role}
      accessibilityState={{
        selected,
        checked: selected,
        disabled,
      }}
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}. ${selected ? 'Selected' : 'Not selected'}.`}
      accessibilityHint={a11yHint}
      style={[
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
        disabled && styles.cardDisabled,
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {iconName ? (
          <View
            style={[styles.iconBox, selected && styles.iconBoxSelected]}
            accessible={false}
            importantForAccessibility="no"
          >
            <Feather
              name={iconName}
              size={20}
              color={selected ? Colors.primary : Colors.textMuted}
            />
          </View>
        ) : null}

        <View style={styles.textColumn}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>
          {description ? (
            <Text style={[styles.description, selected && styles.descriptionSelected]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.indicator,
          isMultiSelect ? styles.indicatorSquare : styles.indicatorCircle,
          selected && styles.indicatorSelected,
        ]}
        accessible={false}
        importantForAccessibility="no"
      >
        {selected ? (
          <Feather name="check" size={14} color={Colors.textInverse} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Layout.spacing.md,
    minHeight: 64,
    ...Layout.shadows.subtle,
  },
  cardUnselected: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  cardSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Layout.spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  iconBoxSelected: {
    backgroundColor: '#DBEAFE',
  },
  textColumn: {
    flex: 1,
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text,
  },
  titleSelected: {
    color: Colors.primary,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  descriptionSelected: {
    color: Colors.textSecondary,
  },
  indicator: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  indicatorCircle: {
    borderRadius: 11,
  },
  indicatorSquare: {
    borderRadius: 6,
  },
  indicatorSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
