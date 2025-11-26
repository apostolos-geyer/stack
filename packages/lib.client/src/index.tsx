"use client";

import React from 'react'
import { useState } from "react";
import superjson from "superjson";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, type HTTPHeaders } from "@trpc/client";
import { createTRPCContext } from '@trpc/tanstack-react-query'

import type { AppRouter } from "@_/api.trpc";
import { makeQueryClient } from './query-client'

export { Provide } from './provide'

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

let clientQueryClient: QueryClient | undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') return makeQueryClient()
  return (clientQueryClient ??= makeQueryClient())
}

export type TRPCQueryClientProviderProps = {
  url: string
  children: React.ReactNode
  headers?: HTTPHeaders
}

export function TRPCQueryClientProvider({ url, children, headers }: TRPCQueryClientProviderProps) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() => createTRPCClient<AppRouter>({
    links: [httpBatchLink({
      transformer: superjson,
      url,
      headers,
      fetch(input, init) {
        return fetch(input, { ...init, credentials: 'include' })
      }
    })]
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
