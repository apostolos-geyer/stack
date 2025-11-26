import { formOptions } from "@tanstack/react-form";
import { z } from "zod";
import type { AuthClient } from "@_/infra.auth/client";

export const signUpSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

export type SignUpData = z.infer<typeof signUpSchema>;

const signUpDefaultValues: SignUpData = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
};

export const signUpFormOpts = formOptions({
  defaultValues: signUpDefaultValues,
});

export function createHandleSignUp(authClient: AuthClient) {
  return async (
    data: SignUpData,
    callbacks: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    const result = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name || "",
    });

    if (result.error) {
      callbacks.onError?.(new Error(result.error.message));
    } else {
      callbacks.onSuccess?.();
    }
  };
}

export const signUpValidators = {
  onBlur: signUpSchema,
  onSubmit: signUpSchema,
};
