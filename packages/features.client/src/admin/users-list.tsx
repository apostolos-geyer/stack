"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAdminFeatures } from "./index";

type UsersFilters = {
  limit: number;
  offset: number;
  search: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
};

type ListUsersResponse = {
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

type UsersListFeaturesValue = {
  usersQuery: UseQueryResult<ListUsersResponse, Error>;
  filters: UsersFilters;
  setFilters: React.Dispatch<React.SetStateAction<UsersFilters>>;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: string, sortDirection: "asc" | "desc") => void;
};

const UsersListFeaturesContext =
  createContext<UsersListFeaturesValue | null>(null);

export function useUsersListFeatures() {
  const ctx = useContext(UsersListFeaturesContext);
  if (!ctx)
    throw new Error(
      "useUsersListFeatures must be used within UsersListFeaturesProvider"
    );
  return ctx;
}

export function createUsersListFeatures() {
  return function UsersListFeaturesProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const { authClient } = useAdminFeatures();

    const [filters, setFilters] = useState<UsersFilters>({
      limit: 10,
      offset: 0,
      search: "",
      sortBy: "createdAt",
      sortDirection: "desc",
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

    return (
      <UsersListFeaturesContext.Provider
        value={{
          usersQuery,
          filters,
          setFilters,
          setSearch,
          setPage,
          setPageSize,
          setSorting,
        }}
      >
        {children}
      </UsersListFeaturesContext.Provider>
    );
  };
}
