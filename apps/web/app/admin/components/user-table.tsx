"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { SearchIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@_/ui.web/components/table";
import { Button } from "@_/ui.web/components/button";
import { Input } from "@_/ui.web/components/input";
import { useUsersListFeatures } from "@_/features.client/admin/users-list";
import { createColumns, type User } from "./columns";

type UserTableProps = {
  onEdit: (user: User) => void;
  onBan: (user: User) => void;
  onUnban: (user: User) => void;
  onDelete: (user: User) => void;
  onSetRole: (user: User) => void;
  onCreateUser: () => void;
};

export function UserTable({
  onEdit,
  onBan,
  onUnban,
  onDelete,
  onSetRole,
  onCreateUser,
}: UserTableProps) {
  const { usersQuery, filters, setSearch, setPage, setSorting } =
    useUsersListFeatures();

  const [sorting, setSortingState] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState(filters.search);

  const columns = createColumns({
    onEdit,
    onBan,
    onUnban,
    onDelete,
    onSetRole,
  });

  const table = useReactTable({
    data: (usersQuery.data?.users as User[]) || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSortingState(newSorting);
      const firstSort = newSorting[0];
      if (firstSort) {
        setSorting(
          firstSort.id,
          firstSort.desc ? "desc" : "asc"
        );
      }
    },
  });

  const totalPages = usersQuery.data
    ? Math.ceil(usersQuery.data.total / filters.limit)
    : 0;
  const currentPage = Math.floor(filters.offset / filters.limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button onClick={onCreateUser}>Add User</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {usersQuery.isPending ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-destructive"
                >
                  Error: {usersQuery.error.message}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {usersQuery.data?.total
            ? `Showing ${filters.offset + 1}-${Math.min(
                filters.offset + filters.limit,
                usersQuery.data.total
              )} of ${usersQuery.data.total} users`
            : "No users"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
