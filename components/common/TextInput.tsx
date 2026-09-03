import React, { useState, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  accessibilityHint?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  accessibilityHint,
  onFocus,
  onBlur,
  placeholderTextColor = Colors.textMuted,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  const handleWrapperPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} accessible={true} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={handleWrapperPress}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          Boolean(error) && styles.inputWrapperError,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <RNTextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholderTextColor={placeholderTextColor}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label || rest.placeholder}
          accessibilityHint={accessibilityHint}
          aria-invalid={Boolean(error)}
          {...rest}
        />

        {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
      </Pressable>

      {error ? (
        <Text
          style={styles.errorText}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Layout.spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.lg,
    minHeight: 52,
    paddingHorizontal: Layout.spacing.md,
  },
  inputWrapperFocused: {
    borderColor: Colors.surfaceBorderFocus,
    backgroundColor: Colors.background,
    ...Layout.shadows.subtle,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBackground,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text,
    paddingVertical: Layout.spacing.sm + 2,
    minHeight: 48,
  },
  leftIconContainer: {
    marginRight: Layout.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: Layout.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.error,
    color: Colors.error,
    marginTop: Layout.spacing.xs,
    marginLeft: Layout.spacing.xs,
  },
});
