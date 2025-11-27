"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthClient } from "@_/infra.auth/client";

type AdminFeaturesValue = {
  authClient: AuthClient;
};

const AdminFeaturesContext = createContext<AdminFeaturesValue | null>(null);

export function useAdminFeatures() {
  const ctx = useContext(AdminFeaturesContext);
  if (!ctx)
    throw new Error(
      "useAdminFeatures must be used within AdminFeaturesProvider"
    );
  return ctx;
}

export function createAdminFeatures(authClient: AuthClient) {
  return function AdminFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <AdminFeaturesContext.Provider value={{ authClient }}>
        {children}
      </AdminFeaturesContext.Provider>
    );
  };
}

export * from "./schemas";
