"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useAdminFeatures } from "./index";

type HasPermissionInput = {
  userId?: string;
  permission: Record<string, string[]>;
};

type PermissionsFeaturesValue = {
  hasPermissionMutation: UseMutationResult<boolean, Error, HasPermissionInput>;
};

const PermissionsFeaturesContext =
  createContext<PermissionsFeaturesValue | null>(null);

export function usePermissionsFeatures() {
  const ctx = useContext(PermissionsFeaturesContext);
  if (!ctx)
    throw new Error(
      "usePermissionsFeatures must be used within PermissionsFeaturesProvider"
    );
  return ctx;
}

export function createPermissionsFeatures() {
  return function PermissionsFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const { authClient } = useAdminFeatures();

    const hasPermissionMutation = useMutation({
      mutationFn: async ({ userId, permission }: HasPermissionInput) => {
        const result = await authClient.admin.hasPermission({
          userId,
          permission,
        });
        if (result.error) throw new Error(result.error.message);
        return result.data?.success ?? false;
      },
    });

    return (
      <PermissionsFeaturesContext.Provider
        value={{
          hasPermissionMutation,
        }}
      >
        {children}
      </PermissionsFeaturesContext.Provider>
    );
  };
}
