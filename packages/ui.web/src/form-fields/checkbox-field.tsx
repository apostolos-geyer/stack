"use client"

import * as React from "react"

import { useFieldContext } from "@_/lib.client/form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldContent,
} from "@_/ui.web/components/field"
import { Checkbox } from "@_/ui.web/components/checkbox"

export type CheckboxFieldProps = Omit<
  React.ComponentProps<typeof Checkbox>,
  "name" | "id" | "checked" | "onCheckedChange"
> & {
  label?: React.ReactNode
  description?: React.ReactNode
}

export function CheckboxField({
  label,
  description,
  ...checkboxProps
}: CheckboxFieldProps) {
  const field = useFieldContext<boolean>()

  return (
    <Field
      orientation="horizontal"
      data-invalid={field.state.meta.errors.length > 0 || undefined}
    >
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={(checked) =>
          field.handleChange(checked === true ? true : false)
        }
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        {...checkboxProps}
      />
      <FieldContent>
        {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError errors={field.state.meta.errors} />
      </FieldContent>
    </Field>
  )
}
