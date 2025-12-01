# native

Expo 54 React Native application with NativeWind.

## Purpose

Mobile application for iOS and Android. Shares feature logic with web via `@_/features.client`.

## Run

```bash
pnpm --filter native dev     # Start Expo dev server
pnpm --filter native ios     # Run on iOS simulator
pnpm --filter native android # Run on Android emulator
```

## Structure

```
app/              # Expo Router pages
components/       # App-specific composed components
```

## Key Dependencies

- `@_/features.client` - React hooks, providers, auth client (auto-resolves to native)
- `@_/ui.native` - NativeWind UI primitives
- `expo-secure-store` - Secure token storage for auth

## Auth

Auth client auto-resolves to `client.native.ts` which uses `expo-secure-store` for token persistence.

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for patterns
