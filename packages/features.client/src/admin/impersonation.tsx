"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useAdminFeatures } from "./index";
import { useAuthFeatures } from "../auth";

type ImpersonationFeaturesValue = {
  impersonateUserMutation: UseMutationResult<void, Error, string>;
  stopImpersonatingMutation: UseMutationResult<void, Error, void>;
  isImpersonating: boolean;
};

const ImpersonationFeaturesContext =
  createContext<ImpersonationFeaturesValue | null>(null);

export function useImpersonationFeatures() {
  const ctx = useContext(ImpersonationFeaturesContext);
  if (!ctx)
    throw new Error(
      "useImpersonationFeatures must be used within ImpersonationFeaturesProvider"
    );
  return ctx;
}

export function createImpersonationFeatures() {
  return function ImpersonationFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const { authClient } = useAdminFeatures();
    const { session } = useAuthFeatures();

    const isImpersonating = useMemo(() => {
      return !!session.data?.session?.impersonatedBy;
    }, [session.data?.session?.impersonatedBy]);

    const impersonateUserMutation = useMutation({
      mutationFn: async (userId: string) => {
        const result = await authClient.admin.impersonateUser({
          userId,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: () => {
        window.location.reload();
      },
    });

    const stopImpersonatingMutation = useMutation({
      mutationFn: async () => {
        const result = await authClient.admin.stopImpersonating();
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: () => {
        window.location.reload();
      },
    });

    return (
      <ImpersonationFeaturesContext.Provider
        value={{
          impersonateUserMutation,
          stopImpersonatingMutation,
          isImpersonating,
        }}
      >
        {children}
      </ImpersonationFeaturesContext.Provider>
    );
  };
}
