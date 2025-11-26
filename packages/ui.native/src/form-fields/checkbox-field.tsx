import { useFieldContext } from '@_/lib.client/form';
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@_/ui.native/components/field';
import { Checkbox } from '@_/ui.native/components/checkbox';

export type CheckboxFieldProps = Omit<
  React.ComponentProps<typeof Checkbox>,
  'checked' | 'onCheckedChange'
> & {
  label?: string;
  description?: string;
};

export function CheckboxField({
  label,
  description,
  ...checkboxProps
}: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();

  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={field.state.value ?? false}
        onCheckedChange={(checked) =>
          field.handleChange(checked === true ? true : false)
        }
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        {...checkboxProps}
      />
      <FieldContent>
        {label && <FieldLabel>{label}</FieldLabel>}
        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError errors={field.state.meta.errors} />
      </FieldContent>
    </Field>
  );
}
