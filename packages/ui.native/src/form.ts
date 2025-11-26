import { createHooks } from '@_/lib.client/form';
import { CheckboxField, EmailField, PasswordField, TextField } from './form-fields';
import { SubmitButton } from './form-components';

export const { useAppForm, withForm } = createHooks({
  fieldComponents: { TextField, EmailField, PasswordField, CheckboxField },
  formComponents: { SubmitButton },
});

export { useFieldContext, useFormContext } from '@_/lib.client/form';
