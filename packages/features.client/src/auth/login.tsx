'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useAuthFeatures } from './index';
import {
  signInSchema,
  signUpSchema,
  signInDefaultValues,
  signUpDefaultValues,
  type SignInData,
  type SignUpData,
} from './schemas';

type LoginFeaturesValue = {
  signInSchema: typeof signInSchema;
  signUpSchema: typeof signUpSchema;
  signInDefaultValues: typeof signInDefaultValues;
  signUpDefaultValues: typeof signUpDefaultValues;
  signInMutation: UseMutationResult<void, Error, SignInData>;
  signUpMutation: UseMutationResult<void, Error, SignUpData>;
  handleSignIn: (
    data: SignInData,
    callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void },
  ) => Promise<void>;
  handleSignUp: (
    data: SignUpData,
    callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void },
  ) => Promise<void>;
};

const LoginFeaturesContext = createContext<LoginFeaturesValue | null>(null);

export function useLoginFeatures() {
  const ctx = useContext(LoginFeaturesContext);
  if (!ctx)
    throw new Error(
      'useLoginFeatures must be used within LoginFeaturesProvider',
    );
  return ctx;
}

export function createLoginFeatures() {
  return function LoginFeaturesProvider({ children }: { children: ReactNode }) {
    const { authClient } = useAuthFeatures();

    const signInMutation = useMutation({
      mutationFn: async (data: SignInData) => {
        const result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        });
        if (result.error) throw new Error(result.error.message);
      },
    });

    const signUpMutation = useMutation({
      mutationFn: async (data: SignUpData) => {
        const result = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name || '',
        });
        if (result.error) throw new Error(result.error.message);
      },
    });

    const handleSignIn = async (
      data: SignInData,
      callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void },
    ) => {
      try {
        await signInMutation.mutateAsync(data);
        callbacks?.onSuccess?.();
      } catch (e) {
        callbacks?.onError?.(e as Error);
      }
    };

    const handleSignUp = async (
      data: SignUpData,
      callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void },
    ) => {
      try {
        await signUpMutation.mutateAsync(data);
        callbacks?.onSuccess?.();
      } catch (e) {
        callbacks?.onError?.(e as Error);
      }
    };

    return (
      <LoginFeaturesContext.Provider
        value={{
          signInSchema,
          signUpSchema,
          signInDefaultValues,
          signUpDefaultValues,
          signInMutation,
          signUpMutation,
          handleSignIn,
          handleSignUp,
        }}
      >
        {children}
      </LoginFeaturesContext.Provider>
    );
  };
}
