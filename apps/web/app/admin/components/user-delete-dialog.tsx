"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@_/ui.web/components/alert-dialog";
import { useDeleteUserMutation } from "@_/features.client/admin/hooks";
import { toast } from "sonner";
import type { User } from "./columns";

type UserDeleteDialogProps = {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserDeleteDialog({
  user,
  open,
  onOpenChange,
}: UserDeleteDialogProps) {
  const deleteUserMutation = useDeleteUserMutation();

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast.success("User deleted successfully");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {user?.email}? This action cannot be
            undone and will permanently remove the user and all their data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
