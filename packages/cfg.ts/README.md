# @_/cfg.ts

Shared TypeScript configuration.

## Purpose

Base `tsconfig.json` extended by all packages and apps.

## Usage

```json
{
  "extends": "@_/cfg.ts/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Configurations

- `base.json` - Strict TypeScript config with modern settings
- Additional configs for specific use cases (React, Node, etc.)
