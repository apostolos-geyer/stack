import { createHooks } from "@_/lib.client/form"

import { TextField } from "./form-fields/text-field"
import { EmailField } from "./form-fields/email-field"
import { PasswordField } from "./form-fields/password-field"
import { CheckboxField } from "./form-fields/checkbox-field"
import { SubmitButton } from "./form-components/submit-button"

export const { useAppForm, withForm } = createHooks({
  fieldComponents: {
    TextField,
    EmailField,
    PasswordField,
    CheckboxField,
  },
  formComponents: {
    SubmitButton,
  },
})

// Re-export context hooks for escape hatch usage
export { useFieldContext, useFormContext } from "@_/lib.client/form"

export type { TextFieldProps } from "./form-fields/text-field"
export type { EmailFieldProps } from "./form-fields/email-field"
export type { PasswordFieldProps } from "./form-fields/password-field"
export type { CheckboxFieldProps } from "./form-fields/checkbox-field"
export type { SubmitButtonProps } from "./form-components/submit-button"
