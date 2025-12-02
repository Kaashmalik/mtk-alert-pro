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
import { colors, borderRadius, spacing, fontSize } from '@/lib/theme';

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
            placeholderTextColor={colors.text.tertiary}
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
                <Eye size={20} color={colors.text.tertiary} />
              ) : (
                <EyeOff size={20} color={colors.text.tertiary} />
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
    marginBottom: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.brand.red,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: spacing.md,
  },
  rightIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.status.error,
  },
});

Input.displayName = 'Input';
