import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { sharedConfig } from '../eslint.base.mjs';

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
  }),

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
      'src/utils/is-react-component.ts',
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
);
