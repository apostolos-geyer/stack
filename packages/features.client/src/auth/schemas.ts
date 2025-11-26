import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

export type SignInData = z.infer<typeof signInSchema>;

export const signInDefaultValues: SignInData = {
  email: "",
  password: "",
  rememberMe: false,
};

export const signUpSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

export type SignUpData = z.infer<typeof signUpSchema>;

export const signUpDefaultValues: SignUpData = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
};
