# storybook.web

Storybook 8 for component documentation and visual testing.

## Purpose

Document and test UI components from `@_/ui.web`.

## Run

```bash
pnpm --filter storybook.web dev            # Start Storybook
pnpm --filter storybook.web build:storybook # Build static site
```

## Adding Stories

Stories live alongside components in `packages/ui.web/src/components/`:

```typescript
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Click me' },
};
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for UI architecture
