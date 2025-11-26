import { useFieldContext } from '@_/lib.client/form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@_/ui.native/components/field';
import { Input } from '@_/ui.native/components/input';
import type { TextInputProps } from 'react-native';

export type TextFieldProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur'
> & {
  label?: string;
  description?: string;
};

export function TextField({
  label,
  description,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>();

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {description && <FieldDescription>{description}</FieldDescription>}
      <Input
        value={field.state.value ?? ''}
        onChangeText={field.handleChange}
        onBlur={field.handleBlur}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        {...inputProps}
      />
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}
