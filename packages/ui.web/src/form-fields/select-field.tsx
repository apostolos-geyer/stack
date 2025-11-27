"use client"

import * as React from "react"

import { useFieldContext } from "@_/lib.client/form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@_/ui.web/components/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@_/ui.web/components/native-select"

export type SelectFieldOption = {
  value: string
  label: string
}

export type SelectFieldProps = Omit<
  React.ComponentProps<typeof NativeSelect>,
  "name" | "id" | "value" | "onChange" | "onBlur" | "children"
> & {
  label?: React.ReactNode
  description?: React.ReactNode
  options: SelectFieldOption[]
  placeholder?: string
}

export function SelectField({
  label,
  description,
  options,
  placeholder,
  ...selectProps
}: SelectFieldProps) {
  const field = useFieldContext<string>()

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      {description && <FieldDescription>{description}</FieldDescription>}
      <NativeSelect
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        {...selectProps}
      >
        {placeholder && (
          <NativeSelectOption value="" disabled>
            {placeholder}
          </NativeSelectOption>
        )}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldError errors={field.state.meta.errors} />
    </Field>
  )
}
