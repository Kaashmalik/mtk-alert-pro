import { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { designSystem } from '@/theme/design-system';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, secureTextEntry, style, ...props }, ref) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            error && styles.inputError,
            isFocused && styles.inputFocused,
            props.editable === false && styles.inputDisabled,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={designSystem.colors.text.muted}
            secureTextEntry={isSecure}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              style={styles.rightIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isSecure ? (
                <Eye size={20} color={designSystem.colors.text.muted} />
              ) : (
                <EyeOff size={20} color={designSystem.colors.text.muted} />
              )}
            </TouchableOpacity>
          )}
          {rightIcon && !secureTextEntry && (
            <View style={styles.rightIcon}>{rightIcon}</View>
          )}
        </View>
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: designSystem.spacing.sm,
    fontSize: designSystem.typography.size.sm,
    fontWeight: '500',
    color: designSystem.colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background.secondary,
    borderRadius: designSystem.layout.radius.lg,
    borderWidth: 1,
    borderColor: designSystem.colors.border.default,
    paddingHorizontal: designSystem.spacing.lg,
  },
  inputFocused: {
    borderColor: designSystem.colors.primary[500],
    ...designSystem.shadows.glow.primary,
  },
  inputError: {
    borderColor: designSystem.colors.status.danger,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: designSystem.spacing.md,
  },
  rightIcon: {
    marginLeft: designSystem.spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: designSystem.typography.size.base,
    color: designSystem.colors.text.primary,
    fontFamily: designSystem.typography.fontFamily.regular,
  },
  error: {
    marginTop: designSystem.spacing.xs,
    fontSize: designSystem.typography.size.sm,
    color: designSystem.colors.status.danger,
  },
});

Input.displayName = 'Input';
