import { formOptions } from "@tanstack/react-form";
import { z } from "zod";
import type { AuthClient } from "@_/infra.auth/client";

export const signInSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

export type SignInData = z.infer<typeof signInSchema>;

const defaultValues: SignInData = {
  email: "",
  password: "",
  rememberMe: false,
};

export const signInFormOpts = formOptions({
  defaultValues,
});

export function createHandleSignIn(authClient: AuthClient) {
  return async (
    data: SignInData,
    callbacks: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.error) {
      callbacks.onError?.(new Error(result.error.message));
    } else {
      callbacks.onSuccess?.();
    }
  };
}

export const signInValidators = {
  onBlur: signInSchema,
  onSubmit: signInSchema,
};
