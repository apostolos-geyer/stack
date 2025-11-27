"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useAdminFeatures } from "./index";
import type { CreateUserData, UpdateUserData, BanUserData } from "./schemas";

type UserMutationsFeaturesValue = {
  createUserMutation: UseMutationResult<void, Error, CreateUserData>;
  updateUserMutation: UseMutationResult<
    void,
    Error,
    { userId: string; data: UpdateUserData }
  >;
  setRoleMutation: UseMutationResult<
    void,
    Error,
    { userId: string; role: "admin" | "user" }
  >;
  banUserMutation: UseMutationResult<
    void,
    Error,
    { userId: string; banReason?: string }
  >;
  unbanUserMutation: UseMutationResult<void, Error, string>;
  deleteUserMutation: UseMutationResult<void, Error, string>;
};

const UserMutationsFeaturesContext =
  createContext<UserMutationsFeaturesValue | null>(null);

export function useUserMutationsFeatures() {
  const ctx = useContext(UserMutationsFeaturesContext);
  if (!ctx)
    throw new Error(
      "useUserMutationsFeatures must be used within UserMutationsFeaturesProvider"
    );
  return ctx;
}

export function createUserMutationsFeatures() {
  return function UserMutationsFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const { authClient } = useAdminFeatures();
    const queryClient = useQueryClient();

    const invalidateUsers = () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    };

    const createUserMutation = useMutation({
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

    const updateUserMutation = useMutation({
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

    const setRoleMutation = useMutation({
      mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
        const result = await authClient.admin.setRole({
          userId,
          role,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: invalidateUsers,
    });

    const banUserMutation = useMutation({
      mutationFn: async ({
        userId,
        banReason,
      }: {
        userId: string;
        banReason?: string;
      }) => {
        const result = await authClient.admin.banUser({
          userId,
          banReason,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: invalidateUsers,
    });

    const unbanUserMutation = useMutation({
      mutationFn: async (userId: string) => {
        const result = await authClient.admin.unbanUser({
          userId,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: invalidateUsers,
    });

    const deleteUserMutation = useMutation({
      mutationFn: async (userId: string) => {
        const result = await authClient.admin.removeUser({
          userId,
        });
        if (result.error) throw new Error(result.error.message);
      },
      onSuccess: invalidateUsers,
    });

    return (
      <UserMutationsFeaturesContext.Provider
        value={{
          createUserMutation,
          updateUserMutation,
          setRoleMutation,
          banUserMutation,
          unbanUserMutation,
          deleteUserMutation,
        }}
      >
        {children}
      </UserMutationsFeaturesContext.Provider>
    );
  };
}
