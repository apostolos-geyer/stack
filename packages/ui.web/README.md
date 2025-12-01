# @_/ui.web

shadcn/Radix UI components for web.

## Purpose

Primitive UI components built with Radix UI and styled with Tailwind. Used by `apps/web`.

## Exports

```typescript
import { Button, buttonVariants } from '@_/ui.web/button';
import { Input } from '@_/ui.web/input';
import { Dialog, DialogContent, DialogTrigger } from '@_/ui.web/dialog';
import { Card, CardHeader, CardContent } from '@_/ui.web/card';
```

## Adding Components

Use shadcn CLI or create manually in `src/components/`:

```typescript
// src/components/my-component.tsx
import { cn } from '@_/ui.utils';

export function MyComponent({ className, ...props }) {
  return <div className={cn('base-styles', className)} {...props} />;
}
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for UI layer separation
- Stories in `apps/storybook.web`
