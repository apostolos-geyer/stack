import { z } from "zod";

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export const updateProfileDefaultValues: UpdateProfileData = {
  name: "",
  image: "",
};

// Password change schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaultValues: ChangePasswordData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  revokeOtherSessions: true,
};

// Email change schema
export const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

export type ChangeEmailData = z.infer<typeof changeEmailSchema>;

export const changeEmailDefaultValues: ChangeEmailData = {
  newEmail: "",
};

// Account deletion schema
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete account"),
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: "Please type DELETE to confirm",
  }),
});

export type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

export const deleteAccountDefaultValues: DeleteAccountData = {
  password: "",
  confirmation: "",
};
