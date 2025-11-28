"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useAuthFeatures } from "../auth";
import {
  updateProfileSchema,
  updateProfileDefaultValues,
  changePasswordSchema,
  changePasswordDefaultValues,
  changeEmailSchema,
  changeEmailDefaultValues,
  deleteAccountSchema,
  deleteAccountDefaultValues,
  type UpdateProfileData,
  type ChangePasswordData,
  type ChangeEmailData,
  type DeleteAccountData,
} from "./schemas";

type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AccountFeaturesValue = {
  // Profile
  updateProfileSchema: typeof updateProfileSchema;
  updateProfileDefaultValues: typeof updateProfileDefaultValues;
  updateProfileMutation: UseMutationResult<void, Error, UpdateProfileData>;
  // Password
  changePasswordSchema: typeof changePasswordSchema;
  changePasswordDefaultValues: typeof changePasswordDefaultValues;
  changePasswordMutation: UseMutationResult<void, Error, ChangePasswordData>;
  // Email
  changeEmailSchema: typeof changeEmailSchema;
  changeEmailDefaultValues: typeof changeEmailDefaultValues;
  changeEmailMutation: UseMutationResult<void, Error, ChangeEmailData>;
  // Account deletion
  deleteAccountSchema: typeof deleteAccountSchema;
  deleteAccountDefaultValues: typeof deleteAccountDefaultValues;
  deleteAccountMutation: UseMutationResult<void, Error, DeleteAccountData>;
  // Session management
  sessionsQuery: UseQueryResult<Session[], Error>;
  revokeSessionMutation: UseMutationResult<void, Error, string>;
  revokeAllSessionsMutation: UseMutationResult<void, Error, void>;
};

const AccountFeaturesContext = createContext<AccountFeaturesValue | null>(null);

export function useAccountFeatures() {
  const ctx = useContext(AccountFeaturesContext);
  if (!ctx)
    throw new Error(
      "useAccountFeatures must be used within AccountFeaturesProvider"
    );
  return ctx;
}

type AccountFeaturesOptions = {
  onDeleteSuccess?: () => void;
};

export function createAccountFeatures(options?: AccountFeaturesOptions) {
  return function AccountFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const { authClient, session } = useAuthFeatures();
    const queryClient = useQueryClient();

    // Profile update mutation
    const updateProfileMutation = useMutation({
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

    // Password change mutation
    const changePasswordMutation = useMutation({
      mutationFn: async (data: ChangePasswordData) => {
        const result = await authClient.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          revokeOtherSessions: data.revokeOtherSessions,
        });
        if (result.error) throw new Error(result.error.message);
      },
    });

    // Email change mutation
    const changeEmailMutation = useMutation({
      mutationFn: async (data: ChangeEmailData) => {
        const result = await authClient.changeEmail({
          newEmail: data.newEmail,
          callbackURL: "/settings",
        });
        if (result.error) throw new Error(result.error.message);
      },
    });

    // Account deletion mutation
    const deleteAccountMutation = useMutation({
      mutationFn: async (data: DeleteAccountData) => {
        const result = await authClient.deleteUser({
          password: data.password,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: () => {
        if (options?.onDeleteSuccess) {
          options.onDeleteSuccess();
        } else if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      },
    });

    // List user's own sessions
    const sessionsQuery = useQuery({
      queryKey: ["account", "sessions"],
      queryFn: async () => {
        const result = await authClient.listSessions();
        if (result.error) throw new Error(result.error.message);
        return (result.data ?? []) as Session[];
      },
    });

    // Revoke a specific session
    const revokeSessionMutation = useMutation({
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

    // Revoke all other sessions
    const revokeAllSessionsMutation = useMutation({
      mutationFn: async () => {
        const result = await authClient.revokeOtherSessions();
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["account", "sessions"] });
      },
    });

    return (
      <AccountFeaturesContext.Provider
        value={{
          // Profile
          updateProfileSchema,
          updateProfileDefaultValues,
          updateProfileMutation,
          // Password
          changePasswordSchema,
          changePasswordDefaultValues,
          changePasswordMutation,
          // Email
          changeEmailSchema,
          changeEmailDefaultValues,
          changeEmailMutation,
          // Deletion
          deleteAccountSchema,
          deleteAccountDefaultValues,
          deleteAccountMutation,
          // Sessions
          sessionsQuery,
          revokeSessionMutation,
          revokeAllSessionsMutation,
        }}
      >
        {children}
      </AccountFeaturesContext.Provider>
    );
  };
}

export * from "./schemas";
