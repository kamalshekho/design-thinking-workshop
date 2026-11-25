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
  stylistic,
  restrictedSyntaxRule,
  globals,
  tsconfigRootDir,
  extraIgnores = [],
  extraTestFiles = [],
  tryStatementIgnores = [],
  styleBanIgnores = [],
  filenameNamingIgnores = [],
  runtimeTypeofIgnores = [],
  transportFiles = [],
}) {
  const testFiles = [
    'src/**/*.test.{ts,tsx}',
    'src/test/**',
    ...extraTestFiles,
  ];

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

    /* strictTypeChecked bans eval-like strings in setTimeout and new Function
       through no-implied-eval, but not a direct eval(). A value returned from
       a Promise executor is dropped, so returning one is a bug. */
    {
      rules: {
        'no-eval': 'error',
        'no-promise-executor-return': 'error',
      },
    },

    /* Blank lines between declarations and around control flow, after the
       require-readable-spacing rule of dmmulroy/anti-slop. Compact runs of
       single-line bindings and of imports stay together. The fixer only
       inserts blank lines, Prettier keeps them. */
    {
      files: ['**/*.{ts,tsx}'],
      plugins: { '@stylistic': stylistic },
      rules: {
        '@stylistic/padding-line-between-statements': [
          'error',
          { blankLine: 'always', prev: 'import', next: '*' },
          { blankLine: 'any', prev: 'import', next: 'import' },
          {
            blankLine: 'always',
            prev: '*',
            next: [...multilineDeclarations, 'multiline-expression'],
          },
          {
            blankLine: 'always',
            prev: [
              ...multilineDeclarations,
              'multiline-expression',
              'block-like',
            ],
            next: '*',
          },
          {
            blankLine: 'always',
            prev: '*',
            next: [
              'if',
              'for',
              'while',
              'do',
              'switch',
              'try',
              'return',
              'throw',
            ],
          },
          { blankLine: 'any', prev: 'function-overload', next: 'function' },
          {
            blankLine: 'any',
            prev: 'function-overload',
            next: 'function-overload',
          },
        ],
      },
    },

    {
      files: ['**/*.{ts,tsx}'],
      plugins: {
        'anti-slop': {
          rules: Object.fromEntries(
            Object.keys(ANTI_SLOP_RULES).map((name) => [
              name,
              restrictedSyntaxRule,
            ]),
          ),
        },
      },
      rules: Object.fromEntries(
        Object.entries(ANTI_SLOP_RULES).map(([name, restriction]) => [
          `anti-slop/${name}`,
          ['error', restriction],
        ]),
      ),
    },

    /* Third-party copies keep the render props of react-aria, which take a
       value or a function and tell them apart with typeof. */
    ...(runtimeTypeofIgnores.length > 0
      ? [
          {
            files: runtimeTypeofIgnores,
            rules: { 'anti-slop/no-runtime-typeof': 'off' },
          },
        ]
      : []),

    /* The transport layer receives untyped JSON and hands it to a Zod schema,
       and tests stub that JSON, so unknown is the honest type there. */
    {
      files: [...transportFiles, ...testFiles],
      rules: {
        'anti-slop/no-unknown-parameters': 'off',
        'anti-slop/no-unknown-returns': 'off',
      },
    },

    /** Tests may assert on internals, use non-null assertions and type assertions. */
    {
      files: testFiles,
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

/**
 * The statements padding-line-between-statements surrounds with blank lines.
 * Single-line bindings, exports and type aliases are left out so a run of
 * them can stay compact.
 */
const multilineDeclarations = [
  'multiline-const',
  'multiline-let',
  'multiline-export',
  'multiline-type',
  'function',
  'class',
  'interface',
  'enum',
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

/*
 * The rules below port the syntactic part of dmmulroy/anti-slop, an Oxlint
 * plugin, to selectors. Each runs as its own copy of the core
 * no-restricted-syntax rule, so it reports, turns off and takes an
 * eslint-disable under its anti-slop name. The selectors match syntax, not
 * resolved types: an alias such as `type Raw = unknown` hides the `unknown` it
 * names, which is why the alias itself is banned. no-known-value-widening and
 * the reduce accumulator rules need type information and are left out
 * (docs/STANDARD.md).
 */

/**
 * Joins one alternative from each part into a selector and lists every
 * combination. esquery anchors a `>` inside `:matches()` at the matched node
 * rather than at the outer selector, so alternatives that contain `>` are
 * spelled out instead of grouped.
 */
function anyOf(...parts) {
  return parts
    .reduce(
      (prefixes, part) =>
        prefixes.flatMap((prefix) =>
          part.map((alternative) => `${prefix} ${alternative}`.trim()),
        ),
      [''],
    )
    .join(', ');
}

const FUNCTION_NODES =
  ':matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, TSDeclareFunction, TSEmptyBodyFunctionExpression, TSFunctionType, TSMethodSignature, TSCallSignatureDeclaration, TSConstructorType)';

const TYPE_PREDICATE = `${FUNCTION_NODES}[returnType.typeAnnotation.type='TSTypePredicate']`;

/** A type predicate takes `unknown` by design, so it is left out. */
const FUNCTION_LIKE = [
  `${FUNCTION_NODES}:not([returnType.typeAnnotation.type='TSTypePredicate'])`,
];

/** `cause` is the conventional name for a caught error and may stay unknown. */
const PARAM_TYPE = [
  "> Identifier[name!='cause'] > TSTypeAnnotation",
  '> RestElement > TSTypeAnnotation',
  "> AssignmentPattern > Identifier.left[name!='cause'] > TSTypeAnnotation",
];

const RETURN_TYPE = ['> TSTypeAnnotation.returnType'];

const LOOSE_VALUE =
  ':matches(TSUnknownKeyword, TSAnyKeyword, TSObjectKeyword, TSTypeLiteral[members.length=0])';

const ANTI_SLOP_RULES = {
  'no-module-mocking': {
    selector:
      'CallExpression[callee.object.name=/^(vi|jest)$/][callee.property.name=/^(mock|doMock|unstable_mockModule)$/]',
    message: 'Pass the dependency in instead of mocking a module.',
  },
  'no-reflect-get': {
    selector: "MemberExpression[object.name='Reflect'][property.name='get']",
    message: 'Read the property directly instead of through Reflect.get.',
  },
  'no-reflect-apply': {
    selector: "MemberExpression[object.name='Reflect'][property.name='apply']",
    message: 'Call the function directly instead of through Reflect.apply.',
  },
  /* typeof inside a type predicate is how a predicate checks, so it stays
     allowed there, like the allowInTypeGuards option of anti-slop. A probe
     against 'undefined' stays allowed too. */
  'no-runtime-typeof': {
    selector: `UnaryExpression[operator='typeof']:not([parent.right.type='Literal'][parent.right.value='undefined']):not([parent.left.type='Literal'][parent.left.value='undefined']):not(${TYPE_PREDICATE} UnaryExpression)`,
    message:
      'Parse the value at the boundary or narrow it in a type predicate instead of an ad hoc typeof.',
  },
  'no-unknown-parameters': {
    selector: anyOf(FUNCTION_LIKE, PARAM_TYPE, [
      '> TSUnknownKeyword',
      '> TSUnionType > TSUnknownKeyword',
    ]),
    message: 'Name the type the parameter accepts instead of unknown.',
  },
  'no-object-parameters': {
    selector: anyOf(FUNCTION_LIKE, PARAM_TYPE, [
      '> TSObjectKeyword',
      '> TSUnionType > TSObjectKeyword',
    ]),
    message: 'Name the type the parameter accepts instead of object.',
  },
  'no-unknown-returns': {
    selector: anyOf(FUNCTION_LIKE, RETURN_TYPE, [
      '> TSUnknownKeyword',
      '> TSTypeReference[typeName.name=/^(Promise|PromiseLike)$/] > TSTypeParameterInstantiation > TSUnknownKeyword',
    ]),
    message: 'Name the type the function returns instead of unknown.',
  },
  'no-unknown-type-aliases': {
    selector: anyOf(
      ['TSTypeAliasDeclaration'],
      ['> TSUnknownKeyword', '> TSUnionType > TSUnknownKeyword'],
    ),
    message:
      'Use the type the alias stands for instead of an alias for unknown.',
  },
  /* A generic constraint such as `T extends Record<string, unknown>` stays
     allowed. */
  'no-unsafe-dictionary-type': {
    selector: anyOf(
      [
        ":not(TSTypeParameter) > TSTypeReference[typeName.name='Record'] > TSTypeParameterInstantiation",
        'TSIndexSignature > TSTypeAnnotation',
      ],
      [`> ${LOOSE_VALUE}`],
    ),
    message:
      'Name the value type of the dictionary instead of unknown, any, object or {}.',
  },
};
