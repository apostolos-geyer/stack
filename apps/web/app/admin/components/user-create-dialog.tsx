"use client";

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
import {
  createUserSchema,
  createUserDefaultValues,
} from "@_/features.client/admin/schemas";
import { toast } from "sonner";

type UserCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserCreateDialog({ open, onOpenChange }: UserCreateDialogProps) {
  const { createUserMutation } = useUserMutationsFeatures();

  const form = useAppForm({
    defaultValues: createUserDefaultValues,
    validators: {
      onBlur: createUserSchema,
      onSubmit: createUserSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createUserMutation.mutateAsync(value);
        toast.success("User created successfully");
        onOpenChange(false);
        form.reset();
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Add a new user to the system.
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

              <form.AppField name="email">
                {(field) => (
                  <field.EmailField
                    label="Email"
                    placeholder="user@example.com"
                  />
                )}
              </form.AppField>

              <form.AppField name="password">
                {(field) => (
                  <field.PasswordField label="Password" placeholder="••••••••" />
                )}
              </form.AppField>

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
              <form.SubmitButton disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </form.SubmitButton>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
