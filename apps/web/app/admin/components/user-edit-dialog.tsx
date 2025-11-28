"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@_/ui.web/components/dialog";
import { Button } from "@_/ui.web/components/button";
import { FieldGroup } from "@_/ui.web/components/field";
import { useAppForm } from "@_/ui.web/form";
import { useUpdateUserMutation } from "@_/features.client/admin/hooks";
import { updateUserSchema } from "@_/features.client/admin/schemas";
import { toast } from "sonner";
import type { User } from "./columns";

type UserEditDialogProps = {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserEditDialog({
  user,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const updateUserMutation = useUpdateUserMutation();

  const form = useAppForm({
    defaultValues: {
      name: user?.name || "",
    },
    validators: {
      onBlur: updateUserSchema,
      onSubmit: updateUserSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      try {
        await updateUserMutation.mutateAsync({
          userId: user.id,
          data: value,
        });
        toast.success("User updated successfully");
        onOpenChange(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name || "" });
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information for {user?.email}.
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.TextField label="Name" placeholder="John Doe" />
                )}
              </form.AppField>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <form.SubmitButton disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </form.SubmitButton>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
