import { createAuthClient } from "better-auth/react";

import plugins from "./plugins.client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins,
});

export type AuthClient = typeof authClient;

export const { signIn, signUp, signOut, useSession, subscription } = authClient;
