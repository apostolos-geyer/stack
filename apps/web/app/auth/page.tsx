'use client';

import {
  createLoginFeatures,
  useLoginFeatures,
} from '@_/features.client/auth/login';

import { Provide } from '@_/lib.client';
import { Card } from '@_/ui.web/components/card';
import { FieldGroup } from '@_/ui.web/components/field';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@_/ui.web/components/tabs';
import { useAppForm } from '@_/ui.web/form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';

function SignInForm() {
  const router = useRouter();
  const { signInDefaultValues, signInSchema, signInMutation } =
    useLoginFeatures();

  const form = useAppForm({
    defaultValues: signInDefaultValues,
    validators: {
      onBlur: signInSchema,
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signInMutation.mutateAsync(value);
        router.push('/');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField name="email">
            {(field) => (
              <field.EmailField label="Email" placeholder="you@example.com" />
            )}
          </form.AppField>

          <form.AppField name="password">
            {(field) => (
              <field.PasswordField label="Password" placeholder="••••••••" />
            )}
          </form.AppField>

          <form.AppField name="rememberMe">
            {(field) => <field.CheckboxField label="Remember me" />}
          </form.AppField>
        </FieldGroup>

        <div className="mt-6">
          <form.SubmitButton
            className="w-full"
            disabled={signInMutation.isPending}
          >
            {signInMutation.isPending ? 'Signing in...' : 'Sign In'}
          </form.SubmitButton>
        </div>
      </form>
    </form.AppForm>
  );
}

function SignUpForm() {
  const router = useRouter();
  const { signUpDefaultValues, signUpSchema, signUpMutation } =
    useLoginFeatures();

  const form = useAppForm({
    defaultValues: signUpDefaultValues,
    validators: {
      onBlur: signUpSchema,
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signUpMutation.mutateAsync(value);
        router.push('/');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField name="name">
            {(field) => <field.TextField label="Name" placeholder="John Doe" />}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.EmailField label="Email" placeholder="you@example.com" />
            )}
          </form.AppField>

          <form.AppField name="password">
            {(field) => (
              <field.PasswordField label="Password" placeholder="••••••••" />
            )}
          </form.AppField>

          <form.AppField name="passwordConfirm">
            {(field) => (
              <field.PasswordField
                label="Confirm Password"
                placeholder="••••••••"
              />
            )}
          </form.AppField>
        </FieldGroup>

        <div className="mt-6">
          <form.SubmitButton
            className="w-full"
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending ? 'Creating account...' : 'Sign Up'}
          </form.SubmitButton>
        </div>
      </form>
    </form.AppForm>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'sign-in';

  const handleTabChange = (value: string) => {
    router.push(`?tab=${value}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md space-y-6 p-6">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="sign-in" className="flex-1">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="flex-1">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-6">
            <div className="space-y-2 text-center mb-6">
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your account
              </p>
            </div>
            <SignInForm />
          </TabsContent>

          <TabsContent value="sign-up" className="mt-6">
            <div className="space-y-2 text-center mb-6">
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-muted-foreground text-sm">
                Enter your details to create a new account
              </p>
            </div>
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

const AuthPage = Provide(
  [createLoginFeatures()],
  function AuthPage() {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            Loading...
          </div>
        }
      >
        <AuthPageContent />
      </Suspense>
    );
  },
);

export default AuthPage;
