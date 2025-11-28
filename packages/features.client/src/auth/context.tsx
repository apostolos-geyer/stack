"use client";

import { createContext, useContext } from "react";
import type { AuthClient } from "@_/infra.auth/client";

export type AuthFeaturesValue = {
  authClient: AuthClient;
  session: ReturnType<AuthClient["useSession"]>;
};

export const AuthFeaturesContext = createContext<AuthFeaturesValue | null>(null);

export function useAuthFeatures() {
  const ctx = useContext(AuthFeaturesContext);
  if (!ctx)
    throw new Error(
      "useAuthFeatures must be used within AuthFeaturesProvider"
    );
  return ctx;
}
