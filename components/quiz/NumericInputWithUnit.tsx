import React, { useState, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface NumericInputWithUnitProps {
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const NumericInputWithUnit: React.FC<NumericInputWithUnitProps> = ({
  value,
  onChangeText,
  unit,
  placeholder = '0',
  error,
  maxLength = 4,
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  const handleTextChange = (text: string) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    onChangeText(filtered);
  };

  const handleCardPress = () => {
    inputRef.current?.focus();
  };

  const a11yLabel = accessibilityLabel || `Input value in ${unit}`;
  const a11yHint = accessibilityHint || `Enter numeric amount in ${unit}`;

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        onPress={handleCardPress}
        style={[
          styles.inputCard,
          isFocused && styles.inputCardFocused,
          Boolean(error) && styles.inputCardError,
        ]}
      >
        <RNTextInput
          ref={inputRef}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
          inputMode="numeric"
          maxLength={maxLength}
          style={styles.textInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={a11yLabel}
          accessibilityHint={a11yHint}
          accessibilityValue={{ text: value ? `${value} ${unit}` : `Empty, placeholder is ${placeholder}` }}
          aria-invalid={Boolean(error)}
        />

        <View
          style={styles.unitBadge}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Unit: ${unit}`}
        >
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      </Pressable>

      {error ? (
        <View
          style={styles.errorRow}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Feather name="alert-circle" size={16} color={Colors.error} style={styles.errorIcon} accessible={false} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Layout.spacing.lg,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.xl,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xs,
    minHeight: 72,
    ...Layout.shadows.subtle,
  },
  inputCardFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  inputCardError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBackground,
  },
  textInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: Layout.spacing.sm,
    minHeight: 56,
  },
  unitBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs + 2,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
  },
  errorIcon: {
    marginRight: Layout.spacing.xs + 2,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
});
