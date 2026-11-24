import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import cssModules from 'eslint-plugin-css-modules';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { sharedConfig } from '../eslint.base.mjs';

/* The layers below the feature: what any production code may import. */
const SHARED = ['components', 'content', 'lib', 'styles', 'assets'];

function allow(type, types) {
  return {
    from: { element: { type } },
    allow: { to: { element: { types } } },
  };
}

export default tseslint.config(
  ...sharedConfig({
    js,
    tseslint,
    jsxA11y,
    reactHooks,
    reactRefresh,
    simpleImportSort,
    sonarjs,
    eslintComments,
    checkFile,
    globals,
    tsconfigRootDir: import.meta.dirname,
    extraIgnores: ['storybook-static/**', 'public/mockServiceWorker.js'],
    extraTestFiles: ['src/mocks/**'],
    // The form's transport layer still sits under features/ until it moves out.
    tryStatementIgnores: ['src/features/application-form/api.ts'],
  }),

  /* The import direction of ADR-0008, after the decision in issue #106:
     components/ui, content, lib, styles and assets are shared, the one feature
     sits above them and app above that. eslint-plugin-boundaries describes
     folders as elements and single files as file categories, so
     vite-env.d.ts and the tests are categories. Each layer may import itself.
     The last policy that matches an import decides. */
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: `${import.meta.dirname}/tsconfig.json` },
      },
      'boundaries/root-path': import.meta.dirname,
      'boundaries/elements': [
        {
          type: 'components',
          pattern: 'src/components/ui',
          partialMatch: false,
        },
        { type: 'content', pattern: 'src/content', partialMatch: false },
        { type: 'lib', pattern: 'src/lib', partialMatch: false },
        { type: 'styles', pattern: 'src/styles', partialMatch: false },
        { type: 'assets', pattern: 'src/assets', partialMatch: false },
        {
          type: 'feature',
          pattern: 'src/features/*',
          capture: ['feature'],
          partialMatch: false,
        },
        { type: 'app', pattern: 'src/app', partialMatch: false },
        {
          type: 'test',
          pattern: ['src/test', 'src/mocks'],
          partialMatch: false,
        },
      ],
      'boundaries/files': [
        { category: 'env', pattern: 'src/vite-env.d.ts' },
        {
          category: 'test',
          pattern: [
            'src/test/**',
            'src/mocks/**',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.stories.tsx',
          ],
        },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkInternals: true,
          policies: [
            allow('components', SHARED),
            allow('content', ['content', 'lib']),
            allow('lib', ['lib']),
            {
              from: { element: { type: 'feature' } },
              allow: [
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: {
                        feature: '{{ from.element.captured.feature }}',
                      },
                    },
                  },
                },
                { to: { element: { types: SHARED } } },
              ],
            },
            allow('app', [...SHARED, 'feature', 'app']),
            {
              disallow: { to: { file: { categories: 'test' } } },
              message:
                'Production code does not import test-only code (src/test, src/mocks, tests, stories).',
            },
            {
              from: { file: { categories: 'test' } },
              allow: { to: { module: { origin: 'local' } } },
            },
            /* The one exception: in development, with no VITE_API_BASE_URL,
               the entry point starts Mock Service Worker so the applicant form
               runs without a backend. It goes away once the form no longer has
               to run without a backend in development. */
            {
              from: { file: { path: 'src/app/main.tsx' } },
              allow: {
                to: { file: { path: 'src/mocks/browser.ts' } },
                dependency: { nodeKind: 'dynamic-import' },
              },
            },
          ],
        },
      ],
    },
  },

  /* A CSS module class that no component reads is dead, and a class a
     component reads but the module lacks renders as undefined. Neither shows
     up in the type check, because Vite types a CSS module as a plain record.
     The plugin's CSS parser fails on range media queries such as
     `(width <= 640px)` and then skips the module without a report. That
     leaves Footer, Header, RoutePanel and ApplicationForm unchecked. */
  {
    files: ['src/**/*.tsx'],
    plugins: { 'css-modules': cssModules },
    rules: {
      'css-modules/no-unused-class': 'error',
      'css-modules/no-undef-class': 'error',
    },
  },

  /* Storybook metadata is the documented exception to named exports. */
  {
    files: ['src/**/*.stories.{ts,tsx}'],
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
