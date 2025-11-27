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
import { useUserMutationsFeatures } from "@_/features.client/admin/user-mutations";
import { setRoleSchema } from "@_/features.client/admin/schemas";
import { toast } from "sonner";
import type { User } from "./columns";

type UserRoleDialogProps = {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserRoleDialog({
  user,
  open,
  onOpenChange,
}: UserRoleDialogProps) {
  const { setRoleMutation } = useUserMutationsFeatures();

  const form = useAppForm({
    defaultValues: {
      role: (user?.role as "user" | "admin") || "user",
    },
    validators: {
      onSubmit: setRoleSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      try {
        await setRoleMutation.mutateAsync({
          userId: user.id,
          role: value.role,
        });
        toast.success("Role updated successfully");
        onOpenChange(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ role: (user.role as "user" | "admin") || "user" });
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Change the role for {user?.email}.
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
              <form.AppField name="role">
                {(field) => (
                  <field.SelectField
                    label="Role"
                    options={[
                      { value: "user", label: "User" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
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
              <form.SubmitButton disabled={setRoleMutation.isPending}>
                {setRoleMutation.isPending ? "Updating..." : "Update Role"}
              </form.SubmitButton>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
