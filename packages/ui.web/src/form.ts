import { createHooks } from "@_/features.client/lib/form"

import { TextField } from "./form-fields/text-field"
import { EmailField } from "./form-fields/email-field"
import { PasswordField } from "./form-fields/password-field"
import { CheckboxField } from "./form-fields/checkbox-field"
import { SelectField } from "./form-fields/select-field"
import { SubmitButton } from "./form-components/submit-button"

export const { useAppForm, withForm } = createHooks({
  fieldComponents: {
    TextField,
    EmailField,
    PasswordField,
    CheckboxField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
  },
})

// Re-export context hooks for escape hatch usage
export { useFieldContext, useFormContext } from "@_/features.client/lib/form"

export type { TextFieldProps } from "./form-fields/text-field"
export type { EmailFieldProps } from "./form-fields/email-field"
export type { PasswordFieldProps } from "./form-fields/password-field"
export type { CheckboxFieldProps } from "./form-fields/checkbox-field"
export type { SelectFieldProps } from "./form-fields/select-field"
export type { SubmitButtonProps } from "./form-components/submit-button"
