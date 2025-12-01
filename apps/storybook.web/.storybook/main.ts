import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Resolve the absolute path of a package.
 * Needed for monorepo setups with hoisted node_modules.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: [
    // Co-located stories in ui.web package
    '../../../packages/ui.web/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: getAbsolutePath('@storybook/react-vite'),
  // Tag filtering for sidebar management
  tags: {
    'skip-sidebar': { excludeFromSidebar: true },
    'test-only': { excludeFromSidebar: true },
  },
};

export default config;

