"use client"

import * as React from "react"

import { useFieldContext } from "@_/lib.client/form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@_/ui.web/components/field"
import { Input } from "@_/ui.web/components/input"

export type TextFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "name" | "id" | "value" | "onChange" | "onBlur"
> & {
  label?: React.ReactNode
  description?: React.ReactNode
}

export function TextField({
  label,
  description,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>()

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      {description && <FieldDescription>{description}</FieldDescription>}
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        {...inputProps}
      />
      <FieldError errors={field.state.meta.errors} />
    </Field>
  )
}
