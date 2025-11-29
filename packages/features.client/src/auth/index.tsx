"use client";

import { type ReactNode } from "react";
import type { AuthClient } from "@_/features/auth/client";
import { AuthFeaturesContext } from "./context";

export { useAuthFeatures } from "./context";
export type { AuthFeaturesValue } from "./context";

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
export * from "./hooks";
