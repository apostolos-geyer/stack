"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAdminFeatures } from "./index";

// =============================================================================
// Types
// =============================================================================

export type UsersFilters = {
  limit: number;
  offset: number;
  search: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
};

export type ListUsersResponse = {
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: number | null;
    createdAt: Date;
    image: string | null;
  }>;
  total: number;
};

export type UsersListValue = {
  usersQuery: UseQueryResult<ListUsersResponse, Error>;
  filters: UsersFilters;
  setFilters: React.Dispatch<React.SetStateAction<UsersFilters>>;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: string, sortDirection: "asc" | "desc") => void;
};

const defaultFilters: UsersFilters = {
  limit: 10,
  offset: 0,
  search: "",
  sortBy: "createdAt",
  sortDirection: "desc",
};

// =============================================================================
// Headless Hook
// =============================================================================

/**
 * Headless hook for managing users list with filters, pagination, and sorting.
 * Use this directly if you don't need to share state across components.
 */
export function useUsersList(initialFilters?: Partial<UsersFilters>): UsersListValue {
  const { authClient } = useAdminFeatures();

  const [filters, setFilters] = useState<UsersFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit: filters.limit,
          offset: filters.offset,
          searchValue: filters.search || undefined,
          searchField: "email",
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
        },
      });
      if (result.error) throw new Error(result.error.message);
      return result.data as ListUsersResponse;
    },
  });

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, offset: 0 }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, offset: page * prev.limit }));
  };

  const setPageSize = (size: number) => {
    setFilters((prev) => ({ ...prev, limit: size, offset: 0 }));
  };

  const setSorting = (sortBy: string, sortDirection: "asc" | "desc") => {
    setFilters((prev) => ({ ...prev, sortBy, sortDirection }));
  };

  return {
    usersQuery,
    filters,
    setFilters,
    setSearch,
    setPage,
    setPageSize,
    setSorting,
  };
}

// =============================================================================
// Provider (for sharing state across components)
// =============================================================================

const UsersListContext = createContext<UsersListValue | null>(null);

/**
 * Use this hook when inside a UsersListProvider.
 * For accessing shared users list state across multiple components.
 */
export function useUsersListContext() {
  const ctx = useContext(UsersListContext);
  if (!ctx) {
    throw new Error(
      "useUsersListContext must be used within UsersListProvider"
    );
  }
  return ctx;
}

/**
 * Provider for sharing users list state across components.
 * Use this when multiple components need to read/write the same filters.
 */
export function UsersListProvider({
  children,
  initialFilters,
}: {
  children: ReactNode;
  initialFilters?: Partial<UsersFilters>;
}) {
  const usersList = useUsersList(initialFilters);

  return (
    <UsersListContext.Provider value={usersList}>
      {children}
    </UsersListContext.Provider>
  );
}

// =============================================================================
// Backwards compatibility (deprecated)
// =============================================================================

/** @deprecated Use useUsersListContext instead */
export const useUsersListFeatures = useUsersListContext;

/** @deprecated Use UsersListProvider directly instead */
export function createUsersListFeatures() {
  return UsersListProvider;
}
