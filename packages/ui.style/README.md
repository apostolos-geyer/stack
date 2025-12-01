# @_/ui.style

Tailwind v4 configuration and design token generation.

## Purpose

Central styling configuration. Generates CSS tokens and TypeScript exports for both web and native.

## Exports

```typescript
// PostCSS config
import { postcssConfig } from '@_/ui.style/postcss';

// TypeScript tokens (generated)
import { TOKENS, type ThemeColors } from '@_/ui.style/tokens';
```

```css
/* CSS entry point */
@import '@_/ui.style';
```

## Structure

```
styles.css       # Main CSS with Tailwind imports and @source directives
tokens.css       # CSS custom properties (light/dark themes)
tokens.ts        # Generated TypeScript tokens
postcss.config.js
scripts/
  gen-tokens.mjs # Token generation script
```

## Token Generation

Tokens defined in CSS are converted to TypeScript with multiple color space support (OKLCH, hex, P3):

```bash
pnpm --filter @_/ui.style tokens  # Regenerate tokens.ts
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for UI architecture
