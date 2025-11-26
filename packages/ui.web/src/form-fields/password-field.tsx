"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { useFieldContext } from "@_/lib.client/form"
import { cn } from "@_/ui.utils"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@_/ui.web/components/field"
import { Input } from "@_/ui.web/components/input"
import { Button } from "@_/ui.web/components/button"

export type PasswordFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "name" | "id" | "value" | "onChange" | "onBlur" | "type"
> & {
  label?: React.ReactNode
  description?: React.ReactNode
  showToggle?: boolean
}

export function PasswordField({
  label,
  description,
  showToggle = true,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const field = useFieldContext<string>()
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      {description && <FieldDescription>{description}</FieldDescription>}
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          className={cn(showToggle && "pr-10", className)}
          {...inputProps}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
        )}
      </div>
      <FieldError errors={field.state.meta.errors} />
    </Field>
  )
}
