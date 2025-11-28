"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuthFeatures } from "../auth";
import type {
  UpdateProfileData,
  ChangePasswordData,
  ChangeEmailData,
  DeleteAccountData,
} from "./schemas";

// =============================================================================
// Types
// =============================================================================

export type AccountSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

// =============================================================================
// Profile Mutations
// =============================================================================

export function useUpdateProfileMutation() {
  const { authClient, session } = useAuthFeatures();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const result = await authClient.updateUser({
        name: data.name,
        image: data.image || undefined,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      session.refetch();
    },
  });
}

// =============================================================================
// Password Mutations
// =============================================================================

export function useChangePasswordMutation() {
  const { authClient } = useAuthFeatures();

  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions,
      });
      if (result.error) throw new Error(result.error.message);
    },
  });
}

// =============================================================================
// Email Mutations
// =============================================================================

export function useChangeEmailMutation() {
  const { authClient } = useAuthFeatures();

  return useMutation({
    mutationFn: async (data: ChangeEmailData) => {
      const result = await authClient.changeEmail({
        newEmail: data.newEmail,
        callbackURL: "/settings",
      });
      if (result.error) throw new Error(result.error.message);
    },
  });
}

// =============================================================================
// Account Deletion
// =============================================================================

type DeleteAccountOptions = {
  onSuccess?: () => void;
};

export function useDeleteAccountMutation(options?: DeleteAccountOptions) {
  const { authClient } = useAuthFeatures();

  return useMutation({
    mutationFn: async (data: DeleteAccountData) => {
      const result = await authClient.deleteUser({
        password: data.password,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      } else if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
  });
}

// =============================================================================
// Session Management
// =============================================================================

export function useSessionsQuery() {
  const { authClient } = useAuthFeatures();

  return useQuery({
    queryKey: ["account", "sessions"],
    queryFn: async () => {
      const result = await authClient.listSessions();
      if (result.error) throw new Error(result.error.message);
      return (result.data ?? []) as AccountSession[];
    },
  });
}

export function useRevokeSessionMutation() {
  const { authClient } = useAuthFeatures();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionToken: string) => {
      const result = await authClient.revokeSession({
        token: sessionToken,
      });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", "sessions"] });
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const { authClient } = useAuthFeatures();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.revokeOtherSessions();
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", "sessions"] });
    },
  });
}
