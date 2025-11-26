"use client"

import * as React from "react"

import { TextField, type TextFieldProps } from "./text-field"

export type EmailFieldProps = Omit<TextFieldProps, "type" | "autoComplete">

export function EmailField(props: EmailFieldProps) {
  return <TextField type="email" autoComplete="email" {...props} />
}
