import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export const createUserDefaultValues: CreateUserData = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

export const setRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export type SetRoleData = z.infer<typeof setRoleSchema>;

export const banUserSchema = z.object({
  banReason: z.string().optional(),
  banExpiresIn: z.string().optional(),
});

export type BanUserData = z.infer<typeof banUserSchema>;

export const banUserDefaultValues: BanUserData = {
  banReason: "",
  banExpiresIn: "",
};

export const banDurationOptions = [
  { value: "", label: "Permanent" },
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "24 hours" },
  { value: "604800", label: "7 days" },
  { value: "2592000", label: "30 days" },
] as const;

export const setUserPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SetUserPasswordData = z.infer<typeof setUserPasswordSchema>;

export const setUserPasswordDefaultValues: SetUserPasswordData = {
  newPassword: "",
  confirmPassword: "",
};
