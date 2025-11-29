"use client"

import * as React from "react"

import { useFormContext } from "@_/features.client/lib/form"
import { Button } from "@_/ui.web/components/button"

export type SubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type"
> & {
  loadingText?: string
}

export function SubmitButton({
  children = "Submit",
  loadingText = "Submitting...",
  disabled,
  ...buttonProps
}: SubmitButtonProps) {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state: { isSubmitting: boolean; canSubmit: boolean }) => ({
        isSubmitting: state.isSubmitting,
        canSubmit: state.canSubmit,
      })}
    >
      {({ isSubmitting, canSubmit }: { isSubmitting: boolean; canSubmit: boolean }) => (
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !canSubmit}
          {...buttonProps}
        >
          {isSubmitting ? loadingText : children}
        </Button>
      )}
    </form.Subscribe>
  )
}
