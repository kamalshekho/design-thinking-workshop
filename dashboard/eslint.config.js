import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/defaults';
import {
  MatcherType,
  SelectorKind,
} from 'eslint-plugin-better-tailwindcss/types';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { sharedConfig } from '../eslint.base.mjs';

/* The files copied in from Untitled UI, one per `-> src/...` line in
   THIRD_PARTY_LICENSES. */
const UNTITLED_UI_COPIES = [
  'src/components/application/app-navigation/config.ts',
  'src/components/application/app-navigation/base-components/nav-item.tsx',
  'src/components/application/app-navigation/base-components/nav-list.tsx',
  'src/components/application/app-navigation/base-components/mobile-header.tsx',
  'src/components/application/app-navigation/base-components/nav-account-card.tsx',
  'src/components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx',
  'src/components/application/pagination/pagination.tsx',
  'src/components/application/pagination/pagination-base.tsx',
  'src/components/application/table/table.tsx',
  'src/components/application/application-table/application-table.tsx',
  'src/components/shared/tab-strip.tsx',
  'src/components/base/avatar/avatar.tsx',
  'src/components/base/avatar/avatar-label-group.tsx',
  'src/components/base/badges/badges.tsx',
  'src/components/base/badges/badge-types.ts',
  'src/components/base/buttons/button.tsx',
  'src/components/base/buttons/close-button.tsx',
  'src/components/base/checkbox/checkbox.tsx',
  'src/components/base/input/input.tsx',
  'src/components/base/input/hint-text.tsx',
  'src/components/base/input/label.tsx',
  'src/components/base/toggle/toggle.tsx',
  'src/components/base/tooltip/tooltip.tsx',
  'src/components/foundations/dot-icon.tsx',
  'src/hooks/use-breakpoint.ts',
  'src/utils/cx.ts',
  'src/utils/is-react-component.ts',
];

/* The files copied in from shadcn/ui, one per `-> ...` line in
   THIRD_PARTY_LICENSES. */
const SHADCN_COPIES = [
  'src/components/ui/card.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/sparkline.tsx',
];

/* Every third-party copy: exempt from PascalCase/camelCase filename checks and
   the inline style ban (docs/STANDARD.md). */
const THIRD_PARTY_COPIES = [...UNTITLED_UI_COPIES, ...SHADCN_COPIES];

/* Test files co-located with kebab-case third-party copies keep the same stem. */
const THIRD_PARTY_COPY_TESTS = [
  'src/components/application/application-table/application-table.test.tsx',
  'src/components/ui/sparkline.test.tsx',
];

/* The layers shared UI code may import. Used by the components element
   (everything under components/) and by the Untitled UI copies, some of which
   sit in hooks/ and utils/. */
const SHARED_UI = ['components', 'utils', 'hooks', 'content', 'domain'];

/* Every production element. app and the entry point may import all of them. */
const PRODUCTION = [
  'domain',
  'api',
  'queries',
  'utils',
  'hooks',
  'content',
  'components',
  'feature',
  'app',
  'images',
  'styles',
];

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
    styleBanIgnores: THIRD_PARTY_COPIES,
    filenameNamingIgnores: [...THIRD_PARTY_COPIES, ...THIRD_PARTY_COPY_TESTS],
  }),

  /* The import direction of ADR-0008, after the layer table in issue #106.
     eslint-plugin-boundaries describes folders as elements and single files as
     file categories, so the Untitled UI copies, the entry point and the tests
     are categories. Each layer may import itself. The last policy that
     matches an import decides. */
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: `${import.meta.dirname}/tsconfig.json` },
      },
      'boundaries/root-path': import.meta.dirname,
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain', partialMatch: false },
        { type: 'api', pattern: 'src/api', partialMatch: false },
        { type: 'queries', pattern: 'src/queries', partialMatch: false },
        { type: 'utils', pattern: 'src/utils', partialMatch: false },
        { type: 'hooks', pattern: 'src/hooks', partialMatch: false },
        { type: 'content', pattern: 'src/content', partialMatch: false },
        { type: 'components', pattern: 'src/components', partialMatch: false },
        {
          type: 'feature',
          pattern: 'src/features/*',
          capture: ['feature'],
          partialMatch: false,
        },
        { type: 'app', pattern: 'src/app', partialMatch: false },
        { type: 'images', pattern: 'src/images', partialMatch: false },
        { type: 'styles', pattern: 'src/styles', partialMatch: false },
        {
          type: 'test',
          pattern: ['src/test', 'src/mocks'],
          partialMatch: false,
        },
      ],
      'boundaries/files': [
        { category: 'untitled-ui', pattern: UNTITLED_UI_COPIES },
        { category: 'entry', pattern: 'src/main.tsx' },
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
            allow('domain', ['domain']),
            allow('api', ['api', 'domain']),
            allow('queries', ['queries', 'api', 'domain', 'hooks']),
            allow('utils', ['utils', 'domain']),
            allow('hooks', ['hooks', 'domain', 'utils']),
            allow('content', ['content', 'domain', 'utils']),
            allow('components', [...SHARED_UI, 'images', 'styles']),
            {
              from: { file: { categories: 'untitled-ui' } },
              allow: { to: { element: { types: SHARED_UI } } },
            },
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
                {
                  to: {
                    element: {
                      types: [
                        'components',
                        'queries',
                        'domain',
                        'utils',
                        'hooks',
                        'content',
                      ],
                    },
                  },
                },
              ],
            },
            allow('app', PRODUCTION),
            {
              from: { file: { categories: 'entry' } },
              allow: { to: { element: { types: PRODUCTION } } },
            },
            {
              disallow: { to: { file: { categories: 'test' } } },
              message:
                'Production code does not import test-only code (src/test, src/mocks, tests, stories).',
            },
            {
              from: { file: { categories: 'test' } },
              allow: { to: { module: { origin: 'local' } } },
            },
          ],
        },
      ],
    },
  },

  /* api talks to the server and knows no React (layer table in issue #106). */
  {
    files: ['src/api/**/*.ts'],
    ignores: ['src/api/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom', '@tanstack/react-query'],
          patterns: ['react/*', 'react-dom/*'],
        },
      ],
    },
  },

  /* Inside a feature only the container and its use* hooks read the cache, a
     screen gets its data as props (ADR-0006, ADR-0008). Which file may import
     a module is a question of its file name, and @tanstack/react-query is an
     npm package, which the boundaries policies above do not check. */
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: [
      'src/features/**/*Container.tsx',
      'src/features/**/use*.ts',
      'src/features/**/*.test.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@tanstack/react-query',
              message:
                'Only a *Container.tsx or a use*.ts in a feature reads the cache. Pass the data in as props.',
            },
          ],
          patterns: [
            {
              group: ['@/queries/*', '**/queries/*'],
              message:
                'Only a *Container.tsx or a use*.ts in a feature reads the cache. Pass the data in as props.',
            },
          ],
        },
      ],
    },
  },

  /* Third-party component code copied in from Untitled UI (see
     THIRD_PARTY_LICENSES). We keep it close to upstream so it stays easy to
     re-sync, so its house style is exempt from our stricter rules rather than
     rewritten. Code we author ourselves is not covered here. */
  {
    files: [
      'src/components/application/pagination/**',
      'src/components/application/table/table.tsx',
      'src/components/base/**',
      'src/components/foundations/dot-icon.tsx',
      'src/hooks/use-breakpoint.ts',
    ],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  /* No arbitrary Tailwind values with digits outside `@theme` (docs/STANDARD.md,
     issue #133). Applies to all files in `src/`, including third-party copies. */
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: `${import.meta.dirname}/src/styles/globals.css`,
        selectors: [
          ...getDefaultSelectors(),
          {
            kind: SelectorKind.Attribute,
            name: '^.*ClassName$',
            match: [{ type: MatcherType.String }],
          },
          {
            kind: SelectorKind.Callee,
            name: '^sortCx$',
            match: [
              { type: MatcherType.String },
              { type: MatcherType.ObjectValue },
            ],
          },
          {
            kind: SelectorKind.Variable,
            name: '^(?:styles?|sizes|classNames?|classes|.*Class(?:Name)?|[A-Z][A-Z0-9_]*)$',
            match: [
              { type: MatcherType.String },
              { type: MatcherType.ObjectValue },
            ],
          },
        ],
      },
    },
    rules: {
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            {
              pattern: '(?<!\\bdata|\\btransition)-\\[(?!var\\(--)[^\\]]*\\d',
              message:
                'Literal Tailwind values with digits belong in `@theme` under `src/styles/` or as standard Tailwind classes (docs/STANDARD.md).',
            },
          ],
        },
      ],
    },
  },
);
