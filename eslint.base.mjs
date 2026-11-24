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
  checkFile,
  globals,
  tsconfigRootDir,
  extraIgnores = [],
  extraTestFiles = [],
  tryStatementIgnores = [],
  styleBanIgnores = [],
  filenameNamingIgnores = [],
}) {
  const componentStyleBanIgnores = styleBanIgnores.filter(
    (pattern) =>
      pattern.startsWith('src/features/') ||
      pattern.startsWith('src/components/'),
  );

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

        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'never' },
        ],

        // A default export makes a module harder to find by name and lets the
        // same export be imported under different names (docs/STANDARD.md).
        'no-restricted-exports': [
          'error',
          { restrictDefaultExports: { direct: true } },
        ],

        'no-restricted-syntax': ['error', ...reExportBan, styleBan],
      },
    },

    /* Only the transport layer throws and catches (docs/STANDARD.md). */
    {
      files: ['src/features/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
      ignores: [...tryStatementIgnores, ...styleBanIgnores],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...reExportBan,
          styleBan,
          tryStatementBan,
        ],
      },
    },

    /* Third-party copies keep inline styles while still obeying the re-export
       and transport-layer rules (docs/STANDARD.md). */
    ...(styleBanIgnores.length > 0
      ? [
          {
            files: styleBanIgnores,
            rules: {
              'no-restricted-syntax': ['error', ...reExportBan],
            },
          },
        ]
      : []),
    ...(componentStyleBanIgnores.length > 0
      ? [
          {
            files: componentStyleBanIgnores,
            ignores: [...tryStatementIgnores],
            rules: {
              'no-restricted-syntax': [
                'error',
                ...reExportBan,
                tryStatementBan,
              ],
            },
          },
        ]
      : []),

    /* Component files are PascalCase, non-component modules are camelCase
       (docs/STANDARD.md). Middle extensions like .test and .stories are
       ignored. Non-component .tsx files (entry points, JSX test helpers,
       hook tests) follow camelCase. */
    {
      files: ['src/**/*.{ts,tsx}'],
      ignores: [
        'src/**/*.d.ts',
        'src/**/main.tsx',
        'src/test/*.tsx',
        'src/**/use*.test.tsx',
        ...filenameNamingIgnores,
      ],
      plugins: { 'check-file': checkFile },
      rules: {
        'check-file/filename-naming-convention': [
          'error',
          {
            'src/**/*.tsx': 'PASCAL_CASE',
            'src/**/*.ts': 'CAMEL_CASE',
          },
          { ignoreMiddleExtensions: true },
        ],
      },
    },
    {
      files: ['src/**/main.tsx', 'src/test/*.tsx', 'src/**/use*.test.tsx'],
      ignores: [...filenameNamingIgnores],
      plugins: { 'check-file': checkFile },
      rules: {
        'check-file/filename-naming-convention': [
          'error',
          {
            'src/**/*.tsx': 'CAMEL_CASE',
          },
          { ignoreMiddleExtensions: true },
        ],
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

    /** Tests may assert on internals, use non-null assertions and type assertions. */
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/test/**', ...extraTestFiles],
      rules: {
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },

    /* The Vite config runs in Node, not in the browser, and Vite resolves it
       from a default export. */
    {
      files: ['vite.config.ts'],
      languageOptions: {
        globals: globals.node,
      },
      rules: {
        'no-restricted-exports': 'off',
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
 * barrel files (ADR-0008).
 */
const reExportBan = [
  {
    selector: 'ExportNamedDeclaration[source]',
    message: 'Import from the defining file instead of re-exporting it.',
  },
  {
    selector: 'ExportAllDeclaration',
    message: 'Import from the defining file instead of re-exporting it.',
  },
];

const styleBan = {
  selector: "JSXAttribute[name.name='style']",
  message: 'Use styles and design tokens instead of an inline style.',
};

const tryStatementBan = {
  selector: 'TryStatement',
  message:
    'Only the transport layer throws and catches. Do not use try/catch in features or components.',
};
