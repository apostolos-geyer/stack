import { useUsersListFeatures } from '@_/features.client/admin/users-list';
import { Button } from '@_/ui.web/components/button';
import { Input } from '@_/ui.web/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@_/ui.web/components/table';
import {
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { createColumns, type User } from './columns';
import { UserSessionsRow } from './user-sessions-row';

type UserTableProps = {
  onEdit: (user: User) => void;
  onBan: (user: User) => void;
  onUnban: (user: User) => void;
  onDelete: (user: User) => void;
  onSetRole: (user: User) => void;
  onSetPassword: (user: User) => void;
  onImpersonate: (user: User) => void;
  onCreateUser: () => void;
};

export function UserTable({
  onEdit,
  onBan,
  onUnban,
  onDelete,
  onSetRole,
  onSetPassword,
  onImpersonate,
  onCreateUser,
}: UserTableProps) {
  const { usersQuery, filters, setSearch, setPage, setSorting } =
    useUsersListFeatures();

  const [sorting, setSortingState] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpanded = (userId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const columns = createColumns({
    onEdit,
    onBan,
    onUnban,
    onDelete,
    onSetRole,
    onSetPassword,
    onImpersonate,
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
        typeof updater === 'function' ? updater(sorting) : updater;
      setSortingState(newSorting);
      const firstSort = newSorting[0];
      if (firstSort) {
        setSorting(firstSort.id, firstSort.desc ? 'desc' : 'asc');
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
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-8" />
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {usersQuery.isPending ? (
                <motion.tr
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={columns.length + 1} className="p-0">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="h-[41px] border-b last:border-b-0 animate-pulse bg-muted/10"
                      />
                    ))}
                  </td>
                </motion.tr>
              ) : usersQuery.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center text-destructive"
                  >
                    Error: {usersQuery.error.message}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.flatMap((row) => {
                  const user = row.original;
                  const isExpanded = expandedRows.has(user.id);

                  const rows = [
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.15 }}
                      className="cursor-pointer hover:bg-muted/50 border-b"
                      onClick={() => toggleRowExpanded(user.id)}
                    >
                      <TableCell className="w-8 px-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={
                            cell.column.id === 'actions'
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>,
                  ];

                  if (isExpanded) {
                    rows.push(
                      <UserSessionsRow
                        key={`${row.id}-sessions`}
                        userId={user.id}
                        colSpan={columns.length + 1}
                      />,
                    );
                  }

                  return rows;
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {usersQuery.data?.total
            ? `Showing ${filters.offset + 1}-${Math.min(
                filters.offset + filters.limit,
                usersQuery.data.total,
              )} of ${usersQuery.data.total} users`
            : 'No users'}
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
