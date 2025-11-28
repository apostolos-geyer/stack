import 'react-native-reanimated';

import { cn } from '@_/ui.utils';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import '@_/ui.native/styles.css';
import { TOKENS, type ThemeColors, type ColorToken } from '@_/ui.style/tokens';

import { createAuthFeatures, useAuthFeatures } from '@_/features.client/auth';
import { authClient } from '@_/infra.auth/client';
import { TRPCQueryClientProvider } from '@_/lib.client';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

const AuthFeaturesProvider = createAuthFeatures(authClient);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AuthRouter() {
  const { session } = useAuthFeatures();
  const isLoading = session.isPending;
  const isAuthenticated = !!session.data?.user;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect based on auth state
  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(tabs)" />;
}

function RootLayoutContent() {
  return (
    <AuthFeaturesProvider>
      <AuthRouter />
      <Slot />
    </AuthFeaturesProvider>
  );
}

const useDeriveTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMemo(() => {
    const tokens: Record<ThemeColors, ColorToken> = isDark
      ? TOKENS.dark
      : TOKENS.light;

    const o: Record<ThemeColors | 'text' | 'notification', string> =
      {} as Record<ThemeColors | 'text' | 'notification', string>;
    for (const entry of Object.entries(tokens)) {
      const [color, token] = entry as [ThemeColors, ColorToken];
      o[color] = token.hex;
    }
    o.text = o.foreground;
    o.notification = o.background;
    return {
      ...DefaultTheme,
      dark: isDark,
      colors: o,
    };
  }, [isDark]);
  return theme;
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    LibreBaskerville_400Regular,
    LibreBaskerville_700Bold,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
    ...FontAwesome.font,
  });

  const theme = useDeriveTheme();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <ThemeProvider value={theme}>
      <TRPCQueryClientProvider url={'http://localhost:3000/api/trpc'}>
        <SafeAreaProvider style={{ flex: 1 }}>
          <RootLayoutContent />
        </SafeAreaProvider>
      </TRPCQueryClientProvider>
    </ThemeProvider>
  );
}
