import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    stripeClient({ subscription: true }),
    expoClient({ scheme: "exp", storage: SecureStore, storagePrefix: "exp" }),
  ],
});

export type AuthClient = typeof authClient;

export const { signIn, signUp, signOut, useSession, subscription } = authClient;
