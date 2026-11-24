import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { reExportBan, sharedConfig } from '../eslint.base.mjs';

export default tseslint.config(
  ...sharedConfig({
    js,
    tseslint,
    jsxA11y,
    reactHooks,
    reactRefresh,
    simpleImportSort,
    globals,
    tsconfigRootDir: import.meta.dirname,
    extraIgnores: ['storybook-static/**', 'public/mockServiceWorker.js'],
    extraTestFiles: ['src/mocks/**'],
  }),

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // This entry replaces the one in eslint.base.mjs, so it lists the
      // shared re-export ban again. Design tokens live in CSS. An inline style
      // bypasses the token layer and cannot be linted for literal values (see
      // README.md).
      'no-restricted-syntax': [
        'error',
        ...reExportBan,
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            'Use a CSS module and design tokens instead of an inline style.',
        },
      ],

      // A default export makes a component harder to find by name and lets the
      // same component be imported under different names.
      'no-restricted-exports': [
        'error',
        { restrictDefaultExports: { direct: true } },
      ],
    },
  },

  /**
   * The UI layer must not know the domain. It receives finished strings as
   * props, which is what keeps it reusable by the English staff dashboard and
   * what matches the Figma component boundary (DESIGN.md section 45).
   */
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/content/*', '**/features/*', '**/features/**'],
              message:
                'A UI component must not import copy or domain code. Pass finished strings in as props.',
            },
          ],
        },
      ],
    },
  },

  /* Storybook metadata is the documented exception to named exports. */
  {
    files: ['src/**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-exports': 'off',
      'no-restricted-imports': 'off',
    },
  },

  /* Vite and Vitest resolve their config from a default export. */
  {
    files: ['vite.config.ts'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },

  /* Storybook's config is compiled separately and stays outside src/. */
  {
    files: ['.storybook/**/*.{ts,tsx}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-exports': 'off',
    },
  },
);
