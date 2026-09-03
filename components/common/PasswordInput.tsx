import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TextInput, TextInputProps } from './TextInput';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry' | 'rightIcon' | 'leftIcon'> {
  showLockIcon?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showLockIcon = true,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(true);

  const toggleSecureEntry = () => {
    setIsSecure((prev) => !prev);
  };

  return (
    <TextInput
      secureTextEntry={isSecure}
      autoCapitalize="none"
      autoCorrect={false}
      leftIcon={
        showLockIcon ? (
          <Feather name="lock" size={18} color={Colors.textMuted} />
        ) : undefined
      }
      rightIcon={
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleSecureEntry}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isSecure ? 'Show password text' : 'Hide password text'}
          accessibilityHint="Toggles visibility of password characters"
          style={styles.eyeButton}
        >
          <Feather
            name={isSecure ? 'eye-off' : 'eye'}
            size={18}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      }
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  eyeButton: {
    padding: Layout.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
