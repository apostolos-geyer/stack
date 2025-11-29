import { useFieldContext } from '@_/features.client/lib/form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@_/ui.native/components/field';
import { Icon } from '@_/ui.native/components/icon';
import { Input } from '@_/ui.native/components/input';
import { cn } from '@_/ui.utils';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View, type TextInputProps } from 'react-native';

export type PasswordFieldProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'secureTextEntry'
> & {
  label?: string;
  description?: string;
  showToggle?: boolean;
};

export function PasswordField({
  label,
  description,
  showToggle = true,
  ...inputProps
}: PasswordFieldProps) {
  const field = useFieldContext<string>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {description && <FieldDescription>{description}</FieldDescription>}
      <View className="relative">
        <Input
          value={field.state.value ?? ''}
          onChangeText={field.handleChange}
          onBlur={field.handleBlur}
          secureTextEntry={!showPassword}
          autoComplete="password"
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          className={cn(showToggle && 'pr-12')}
          {...inputProps}
        />
        {showToggle && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-0 h-10 w-10 items-center justify-center sm:h-9"
          >
            <Icon
              as={showPassword ? EyeOff : Eye}
              size={18}
              className="text-muted-foreground"
            />
          </Pressable>
        )}
      </View>
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}
