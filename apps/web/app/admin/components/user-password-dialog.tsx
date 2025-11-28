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
import { useSetUserPasswordMutation } from "@_/features.client/admin/hooks";
import {
  setUserPasswordSchema,
  setUserPasswordDefaultValues,
} from "@_/features.client/admin/schemas";
import { toast } from "sonner";
import type { User } from "./columns";

type UserPasswordDialogProps = {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserPasswordDialog({
  user,
  open,
  onOpenChange,
}: UserPasswordDialogProps) {
  const setUserPasswordMutation = useSetUserPasswordMutation();

  const form = useAppForm({
    defaultValues: setUserPasswordDefaultValues,
    validators: {
      onBlur: setUserPasswordSchema,
      onSubmit: setUserPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      try {
        await setUserPasswordMutation.mutateAsync({
          userId: user.id,
          data: value,
        });
        toast.success("Password updated successfully");
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
          <DialogTitle>Set Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.email}.
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
              <form.AppField name="newPassword">
                {(field) => (
                  <field.PasswordField
                    label="New Password"
                    placeholder="••••••••"
                  />
                )}
              </form.AppField>

              <form.AppField name="confirmPassword">
                {(field) => (
                  <field.PasswordField
                    label="Confirm Password"
                    placeholder="••••••••"
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
              <form.SubmitButton disabled={setUserPasswordMutation.isPending}>
                {setUserPasswordMutation.isPending
                  ? "Updating..."
                  : "Set Password"}
              </form.SubmitButton>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
