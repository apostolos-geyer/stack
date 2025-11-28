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
import { useBanUserMutation } from "@_/features.client/admin/hooks";
import {
  banUserSchema,
  banUserDefaultValues,
  banDurationOptions,
} from "@_/features.client/admin/schemas";
import { toast } from "sonner";
import type { User } from "./columns";

type UserBanDialogProps = {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserBanDialog({ user, open, onOpenChange }: UserBanDialogProps) {
  const banUserMutation = useBanUserMutation();

  const form = useAppForm({
    defaultValues: banUserDefaultValues,
    validators: {
      onSubmit: banUserSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      try {
        await banUserMutation.mutateAsync({
          userId: user.id,
          banReason: value.banReason || undefined,
          banExpiresIn: value.banExpiresIn
            ? parseInt(value.banExpiresIn, 10)
            : undefined,
        });
        toast.success("User banned successfully");
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
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Ban {user?.email} from accessing the system. They will not be able
            to sign in until unbanned.
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
              <form.AppField name="banReason">
                {(field) => (
                  <field.TextField
                    label="Ban Reason (optional)"
                    placeholder="Enter reason for ban..."
                  />
                )}
              </form.AppField>

              <form.AppField name="banExpiresIn">
                {(field) => (
                  <field.SelectField
                    label="Ban Duration"
                    options={banDurationOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
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
              <Button
                type="submit"
                variant="destructive"
                disabled={banUserMutation.isPending}
              >
                {banUserMutation.isPending ? "Banning..." : "Ban User"}
              </Button>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
