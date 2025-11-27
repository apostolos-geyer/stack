import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import plugins from './plugins.client';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
  plugins: [
    ...plugins,
    expoClient({ scheme: 'exp', storage: SecureStore, storagePrefix: 'exp' }),
  ],
});

export type AuthClient = typeof authClient;

export const { signIn, signUp, signOut, useSession, subscription } = authClient;
