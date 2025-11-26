import { useState } from "react"
import { View, Alert, ScrollView } from "react-native"
import { useRouter } from "expo-router"

import { Provide } from "@_/lib.client"
import { createAuthFeatures } from "@_/features.client/auth"
import { createLoginFeatures, useLoginFeatures } from "@_/features.client/auth/login"
import { authClient } from "@_/infra.auth/client"
import { useAppForm } from "@_/ui.native/form"
import { Text } from "@_/ui.native/components/text"
import { Card } from "@_/ui.native/components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@_/ui.native/components/tabs"

function SignInForm() {
  const router = useRouter()
  const { signInDefaultValues, signInSchema, signInMutation } = useLoginFeatures()

  const form = useAppForm({
    defaultValues: signInDefaultValues,
    validators: {
      onBlur: signInSchema,
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signInMutation.mutateAsync(value)
        // Navigate to authenticated area after sign in
        router.replace("/")
      } catch (e) {
        Alert.alert("Error", (e as Error).message)
      }
    },
  })

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
        <form.SubmitButton disabled={signInMutation.isPending}>
          {signInMutation.isPending ? "Signing in..." : "Sign In"}
        </form.SubmitButton>
      </View>
    </form.AppForm>
  )
}

function SignUpForm() {
  const router = useRouter()
  const { signUpDefaultValues, signUpSchema, signUpMutation } = useLoginFeatures()

  const form = useAppForm({
    defaultValues: signUpDefaultValues,
    validators: {
      onBlur: signUpSchema,
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signUpMutation.mutateAsync(value)
        // Navigate to authenticated area after sign up
        router.replace("/")
      } catch (e) {
        Alert.alert("Error", (e as Error).message)
      }
    },
  })

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
        <form.SubmitButton disabled={signUpMutation.isPending}>
          {signUpMutation.isPending ? "Creating account..." : "Sign Up"}
        </form.SubmitButton>
      </View>
    </form.AppForm>
  )
}

function AuthScreenContent() {
  const [tab, setTab] = useState("sign-in")

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
  )
}

const HomeScreen = Provide(
  [createAuthFeatures(authClient), createLoginFeatures()],
  function HomeScreen() {
    return <AuthScreenContent />
  }
)

export default HomeScreen
