"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useAdminFeatures } from "./index";

type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
};

type SessionManagementFeaturesValue = {
  useUserSessions: (userId: string) => UseQueryResult<Session[], Error>;
  revokeSessionMutation: UseMutationResult<void, Error, string>;
  revokeAllSessionsMutation: UseMutationResult<void, Error, string>;
};

const SessionManagementFeaturesContext =
  createContext<SessionManagementFeaturesValue | null>(null);

export function useSessionManagementFeatures() {
  const ctx = useContext(SessionManagementFeaturesContext);
  if (!ctx)
    throw new Error(
      "useSessionManagementFeatures must be used within SessionManagementFeaturesProvider"
    );
  return ctx;
}

export function createSessionManagementFeatures() {
  return function SessionManagementFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const { authClient } = useAdminFeatures();
    const queryClient = useQueryClient();

    const useUserSessions = (userId: string) => {
      return useQuery({
        queryKey: ["admin", "sessions", userId],
        queryFn: async () => {
          const result = await authClient.admin.listUserSessions({
            userId,
          });
          if (result.error) throw new Error(result.error.message);
          return (result.data?.sessions ?? []) as Session[];
        },
        enabled: !!userId,
      });
    };

    const revokeSessionMutation = useMutation({
      mutationFn: async (sessionToken: string) => {
        const result = await authClient.admin.revokeUserSession({
          sessionToken,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      },
    });

    const revokeAllSessionsMutation = useMutation({
      mutationFn: async (userId: string) => {
        const result = await authClient.admin.revokeUserSessions({
          userId,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      },
    });

    return (
      <SessionManagementFeaturesContext.Provider
        value={{
          useUserSessions,
          revokeSessionMutation,
          revokeAllSessionsMutation,
        }}
      >
        {children}
      </SessionManagementFeaturesContext.Provider>
    );
  };
}
