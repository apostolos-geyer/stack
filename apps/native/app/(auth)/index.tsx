import { createAuthFeatures } from '@_/features.client/auth';
import {
  createLoginFeatures,
  useLoginFeatures,
} from '@_/features.client/auth/login';
import { authClient } from '@_/infra.auth/client';

import { Provide } from '@_/lib.client';
import { Card } from '@_/ui.native/components/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@_/ui.native/components/tabs';
import { Text } from '@_/ui.native/components/text';
import { useAppForm } from '@_/ui.native/form';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

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
        router.replace('/(tabs)');
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      }
    },
  });

  return (
    <form.AppForm>
      <View className="gap-4">
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
      </View>

      <View className="mt-6">
        <form.SubmitButton loadingText="Signing in...">
          Sign In
        </form.SubmitButton>
      </View>
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
        router.replace('/(tabs)');
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      }
    },
  });

  return (
    <form.AppForm>
      <View className="gap-4">
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
      </View>

      <View className="mt-6">
        <form.SubmitButton loadingText="Creating account...">
          Sign Up
        </form.SubmitButton>
      </View>
    </form.AppForm>
  );
}

function AuthScreenContent() {
  const [tab, setTab] = useState('sign-in');

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow justify-center px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <Card className="w-full max-w-md self-center p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-6">
            <View className="gap-2 items-center mb-6">
              <Text className="text-2xl font-bold">Welcome Back</Text>
              <Text className="text-muted-foreground text-sm text-center">
                Enter your credentials to access your account
              </Text>
            </View>
            <SignInForm />
          </TabsContent>

          <TabsContent value="sign-up" className="mt-6">
            <View className="gap-2 items-center mb-6">
              <Text className="text-2xl font-bold">Create Account</Text>
              <Text className="text-muted-foreground text-sm text-center">
                Enter your details to create a new account
              </Text>
            </View>
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </Card>
    </ScrollView>
  );
}

const AuthScreen = Provide(
  [createAuthFeatures(authClient), createLoginFeatures()],
  function AuthScreen() {
    return <AuthScreenContent />;
  },
);

export default AuthScreen;
