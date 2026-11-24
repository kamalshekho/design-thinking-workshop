/**
 * The ESLint blocks the applicant form (frontend/) and the staff dashboard
 * (dashboard/) share. Each app's eslint.config.js calls this function and adds
 * the blocks that concern it alone.
 *
 * The plugins come in as parameters because the repo root has no
 * node_modules: a file here cannot import packages, so each app passes in its
 * own installed copies. scripts/check-config-parity.mjs keeps their versions
 * equal.
 *
 * tsconfigRootDir is the app's own folder. import.meta.dirname here would be
 * the repo root, where no tsconfig.json lives.
 */
export function sharedConfig({
  js,
  tseslint,
  jsxA11y,
  reactHooks,
  reactRefresh,
  simpleImportSort,
  sonarjs,
  eslintComments,
  globals,
  tsconfigRootDir,
  extraIgnores = [],
  extraTestFiles = [],
}) {
  return tseslint.config(
    {
      ignores: ['dist/**', 'coverage/**', ...extraIgnores],
    },

    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    jsxA11y.flatConfigs.recommended,

    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
        globals: globals.browser,
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
        'simple-import-sort': simpleImportSort,
      },
      rules: {
        ...reactHooks.configs['recommended-latest'].rules,
        ...reactRefresh.configs.vite.rules,

        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',

        'no-restricted-syntax': ['error', ...reExportBan],
      },
    },

    /* Weeds from issue #107: code kept in a comment, open work parked in a
       comment, and an eslint-disable nobody can explain or that no longer
       disables anything. Git keeps old code and the issue tracker keeps open
       work. */
    {
      linterOptions: { reportUnusedDisableDirectives: 'error' },
      plugins: {
        sonarjs,
        '@eslint-community/eslint-comments': eslintComments,
      },
      rules: {
        'sonarjs/no-commented-code': 'error',
        'no-warning-comments': [
          'error',
          { terms: ['todo', 'fixme', 'hack'], location: 'anywhere' },
        ],
        '@eslint-community/eslint-comments/require-description': 'error',
      },
    },

    /** Tests may assert on internals and use non-null assertions. */
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/test/**', ...extraTestFiles],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },

    /* The Vite config runs in Node, not in the browser. */
    {
      files: ['vite.config.ts'],
      languageOptions: {
        globals: globals.node,
      },
    },

    /* Typed linting needs a TypeScript program, which plain JS config files are
       not part of. */
    {
      files: ['**/*.{js,mjs}'],
      extends: [tseslint.configs.disableTypeChecked],
      languageOptions: {
        globals: globals.node,
      },
    },
  );
}

/**
 * Bans every re-export, `export type … from` and `export * from` included:
 * a module is imported from the file that defines it, and neither app has
 * barrel files (ADR-0008). Exported because a later block that sets
 * no-restricted-syntax replaces these options, so an app adding its own
 * selectors has to list these with them.
 */
export const reExportBan = [
  {
    selector: 'ExportNamedDeclaration[source]',
    message: 'Import from the defining file instead of re-exporting it.',
  },
  {
    selector: 'ExportAllDeclaration',
    message: 'Import from the defining file instead of re-exporting it.',
  },
];
