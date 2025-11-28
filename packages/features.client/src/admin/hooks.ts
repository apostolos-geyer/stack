"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminFeatures } from "./index";
import { useAuthFeatures } from "../auth";
import type {
  CreateUserData,
  UpdateUserData,
  SetUserPasswordData,
} from "./schemas";

// =============================================================================
// User CRUD Mutations
// =============================================================================

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
}

export function useCreateUserMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const result = await authClient.admin.createUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

export function useUpdateUserMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserData;
    }) => {
      const result = await authClient.admin.updateUser({
        userId,
        data,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

export function useSetRoleMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user";
    }) => {
      const result = await authClient.admin.setRole({
        userId,
        role,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

export function useBanUserMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async ({
      userId,
      banReason,
      banExpiresIn,
    }: {
      userId: string;
      banReason?: string;
      banExpiresIn?: number;
    }) => {
      const result = await authClient.admin.banUser({
        userId,
        banReason,
        banExpiresIn,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

export function useUnbanUserMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.unbanUser({
        userId,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

export function useDeleteUserMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.removeUser({
        userId,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

export function useSetUserPasswordMutation() {
  const { authClient } = useAdminFeatures();
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: SetUserPasswordData;
    }) => {
      const result = await authClient.admin.setUserPassword({
        userId,
        newPassword: data.newPassword,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: invalidateUsers,
  });
}

// =============================================================================
// Session Management
// =============================================================================

export type AdminSession = {
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

export function useUserSessions(userId: string) {
  const { authClient } = useAdminFeatures();

  return useQuery({
    queryKey: ["admin", "sessions", userId],
    queryFn: async () => {
      const result = await authClient.admin.listUserSessions({
        userId,
      });
      if (result.error) throw new Error(result.error.message);
      return (result.data?.sessions ?? []) as AdminSession[];
    },
    enabled: !!userId,
  });
}

export function useRevokeSessionMutation() {
  const { authClient } = useAdminFeatures();
  const queryClient = useQueryClient();

  return useMutation({
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
}

export function useRevokeAllSessionsMutation() {
  const { authClient } = useAdminFeatures();
  const queryClient = useQueryClient();

  return useMutation({
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
}

// =============================================================================
// Impersonation
// =============================================================================

export function useIsImpersonating() {
  const { session } = useAuthFeatures();

  return useMemo(() => {
    return !!session.data?.session?.impersonatedBy;
  }, [session.data?.session?.impersonatedBy]);
}

export function useImpersonateMutation() {
  const { authClient } = useAdminFeatures();

  return useMutation({
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
}

export function useStopImpersonatingMutation() {
  const { authClient } = useAdminFeatures();

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.admin.stopImpersonating();
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });
}
