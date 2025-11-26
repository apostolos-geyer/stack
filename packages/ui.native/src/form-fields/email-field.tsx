import { TextField, type TextFieldProps } from './text-field';

export type EmailFieldProps = Omit<TextFieldProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete'>;

export function EmailField(props: EmailFieldProps) {
  return (
    <TextField keyboardType="email-address" autoCapitalize="none" autoComplete="email" {...props} />
  );
}
