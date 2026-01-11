import { forwardRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  type TouchableOpacityProps,
} from 'react-native';
import { designSystem } from '@/theme/design-system';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const getButtonStyle = (variant: ButtonVariant, size: ButtonSize): ViewStyle => {
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: designSystem.layout.radius.lg,
  };

  // Size styles
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    default: { height: 56, paddingHorizontal: 24 },
    sm: { height: 40, paddingHorizontal: 16 },
    lg: { height: 64, paddingHorizontal: 32 },
    icon: { height: 48, width: 48 },
  };

  // Variant styles
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    default: { backgroundColor: designSystem.colors.primary[500] },
    secondary: { backgroundColor: designSystem.colors.background.tertiary },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: designSystem.colors.border.light
    },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: designSystem.colors.status.danger },
  };

  return { ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] };
};

const getTextStyle = (size: ButtonSize): TextStyle => {
  const sizeStyles: Record<ButtonSize, TextStyle> = {
    default: { fontSize: 16 },
    sm: { fontSize: 14 },
    lg: { fontSize: 18 },
    icon: { fontSize: 16 },
  };

  return {
    color: designSystem.colors.text.primary,
    fontWeight: '600',
    fontFamily: designSystem.typography.fontFamily.medium,
    ...sizeStyles[size],
  };
};

export const Button = forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ variant = 'default', size = 'default', loading, disabled, children, style, ...props }, ref) => {
    const isDisabled = disabled || loading;
    const buttonStyle = getButtonStyle(variant, size);
    const textStyle = getTextStyle(size);

    return (
      <TouchableOpacity
        ref={ref as any}
        style={[
          buttonStyle,
          isDisabled && styles.disabled,
          style,
        ]}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : typeof children === 'string' ? (
          <Text style={textStyle}>{children}</Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});

Button.displayName = 'Button';
