"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuthFeatures } from "../auth";
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

export function AdminFeaturesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { authClient } = useAuthFeatures();

  return (
    <AdminFeaturesContext.Provider value={{ authClient }}>
      {children}
    </AdminFeaturesContext.Provider>
  );
}

/** @deprecated Use AdminFeaturesProvider directly */
export function createAdminFeatures() {
  return AdminFeaturesProvider;
}

export * from "./schemas";
export * from "./hooks";
export * from "./users-list";
