"use client"

import { ThemeProvider } from "next-themes"
import { TRPCQueryClientProvider } from "@_/lib.client"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCQueryClientProvider url="/api/trpc">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </TRPCQueryClientProvider>
  )
}
