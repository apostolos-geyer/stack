"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, ArrowUpDownIcon } from "lucide-react";

import { Badge } from "@_/ui.web/components/badge";
import { Button } from "@_/ui.web/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@_/ui.web/components/dropdown-menu";

export type User = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
};

type ColumnActions = {
  onEdit: (user: User) => void;
  onBan: (user: User) => void;
  onUnban: (user: User) => void;
  onDelete: (user: User) => void;
  onSetRole: (user: User) => void;
};

export function createColumns(actions: ColumnActions): ColumnDef<User>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Name
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.getValue("name") || "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Email
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string | null;
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role || "user"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const banned = row.getValue("banned") as boolean | null;
        return banned ? (
          <Badge variant="destructive">Banned</Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Created
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isBanned = user.banned;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => actions.onEdit(user)}>
                Edit user
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onSetRole(user)}>
                Change role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isBanned ? (
                <DropdownMenuItem onClick={() => actions.onUnban(user)}>
                  Unban user
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => actions.onBan(user)}>
                  Ban user
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => actions.onDelete(user)}
                className="text-destructive focus:text-destructive"
              >
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
