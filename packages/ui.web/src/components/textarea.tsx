import * as React from "react"

import { cn } from "@_/ui.utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
