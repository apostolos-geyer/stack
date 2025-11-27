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
});

export type BanUserData = z.infer<typeof banUserSchema>;

export const banUserDefaultValues: BanUserData = {
  banReason: "",
};
