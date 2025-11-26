import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [stripeClient({ subscription: true })],
});

export type AuthClient = typeof authClient;

export const { signIn, signUp, signOut, useSession, subscription } = authClient;
