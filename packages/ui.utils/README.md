# @_/ui.utils

Shared UI utilities.

## Purpose

Class name utilities used by `ui.web` and `ui.native`.

## Exports

```typescript
import { cn } from '@_/ui.utils';
```

## Usage

```typescript
// Merge class names with conflict resolution
cn('px-4 py-2', 'px-8')           // → 'py-2 px-8'
cn('text-red-500', className)      // → conditional classes
cn(condition && 'active', 'base')  // → conditional inclusion
```

Uses `clsx` for conditional classes and `tailwind-merge` for conflict resolution.
