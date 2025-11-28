"use client";

import { useMemo } from "react";
import { useAuthFeatures } from "./context";

/**
 * Check if current user has any of the given roles.
 * Handles comma-separated role strings from session.
 *
 * @param roles - Array of role names to check
 * @returns true if user has at least one of the specified roles
 *
 * @example
 * ```tsx
 * const isAdmin = useHasRoles(["admin"]);
 * const canManage = useHasRoles(["admin", "manager"]);
 * ```
 */
export function useHasRoles(roles: string[]): boolean {
  const { session } = useAuthFeatures();

  return useMemo(() => {
    if (!session.data?.user?.role) return false;
    const userRoles = session.data.user.role.split(",").map((r) => r.trim());
    return roles.some((role) => userRoles.includes(role));
  }, [session.data?.user?.role, roles]);
}

/**
 * Check if current user has any of the given permissions.
 * For client-side conditional rendering (not security).
 *
 * This is a simplified implementation that maps permissions to roles.
 * Admin users have all permissions.
 *
 * @param permissions - Array of permission names to check
 * @returns true if user has at least one of the specified permissions
 *
 * @example
 * ```tsx
 * const canCreateProject = useHasPermissions(["project:create"]);
 * const canManageUsers = useHasPermissions(["user:ban", "user:delete"]);
 * ```
 */
export function useHasPermissions(permissions: string[]): boolean {
  const { session } = useAuthFeatures();

  return useMemo(() => {
    if (!session.data?.user?.role) return false;
    const userRoles = session.data.user.role.split(",").map((r) => r.trim());

    // Admin has all permissions
    if (userRoles.includes("admin")) return true;

    // Check if any permission matches a role
    return permissions.some((perm) => userRoles.includes(perm));
  }, [session.data?.user?.role, permissions]);
}
