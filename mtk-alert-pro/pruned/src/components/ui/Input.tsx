import { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '@/lib/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, secureTextEntry, className, ...props }, ref) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    return (
      <View className="w-full">
        {label && (
          <Text className="mb-2 text-sm font-medium text-slate-300">
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center rounded-xl border bg-slate-800 px-4',
            error ? 'border-red-500' : 'border-slate-600',
            props.editable === false && 'opacity-50'
          )}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={cn(
              'h-14 flex-1 text-base text-white',
              className
            )}
            placeholderTextColor="#64748B"
            secureTextEntry={isSecure}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              className="ml-3"
            >
              {isSecure ? (
                <Eye size={20} color="#64748B" />
              ) : (
                <EyeOff size={20} color="#64748B" />
              )}
            </TouchableOpacity>
          )}
          {rightIcon && !secureTextEntry && (
            <View className="ml-3">{rightIcon}</View>
          )}
        </View>
        {error && (
          <Text className="mt-1 text-sm text-red-500">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
