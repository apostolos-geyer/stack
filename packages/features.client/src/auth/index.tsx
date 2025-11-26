"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthClient } from "@_/infra.auth/client";

type AuthFeaturesValue = {
  authClient: AuthClient;
  session: ReturnType<AuthClient["useSession"]>;
};

const AuthFeaturesContext = createContext<AuthFeaturesValue | null>(null);

export function useAuthFeatures() {
  const ctx = useContext(AuthFeaturesContext);
  if (!ctx)
    throw new Error(
      "useAuthFeatures must be used within AuthFeaturesProvider"
    );
  return ctx;
}

export function createAuthFeatures(authClient: AuthClient) {
  return function AuthFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const session = authClient.useSession();

    return (
      <AuthFeaturesContext.Provider value={{ authClient, session }}>
        {children}
      </AuthFeaturesContext.Provider>
    );
  };
}

export * from "./schemas";
