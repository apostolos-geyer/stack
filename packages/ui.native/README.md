# @_/ui.native

NativeWind components for React Native.

## Purpose

Primitive UI components for mobile using NativeWind (Tailwind for RN) and React Native Reusables.

## Exports

```typescript
import { Button } from '@_/ui.native/button';
import { Input } from '@_/ui.native/input';
import { Text } from '@_/ui.native/text';
```

## NativeWind v5

Uses NativeWind v5 preview with Tailwind v4. A Tailwind v3 config stub exists for compatibility with `@rn-primitives` which doesn't yet support nativewind v5.

## Adding Components

Components follow the React Native Reusables pattern:

```typescript
import { cn } from '@_/ui.utils';
import { Platform } from 'react-native';

export function MyComponent({ className, ...props }) {
  return (
    <View
      className={cn(
        'base-styles',
        Platform.select({ web: 'web-styles', default: 'native-styles' }),
        className
      )}
      {...props}
    />
  );
}
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for UI architecture
