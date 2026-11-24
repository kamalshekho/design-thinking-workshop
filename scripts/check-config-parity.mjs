/**
 * Checks that the applicant form (frontend/) and the staff dashboard
 * (dashboard/) run the shared configuration on the same footing:
 *
 * - the compilerOptions of both tsconfig.json files, apart from paths;
 * - the version ranges of the tools both apps share;
 * - both .nvmrc files.
 *
 * Both apps lint with eslint.base.mjs and format with the root
 * .prettierrc.json, but each installs its own copies of the tools, and each
 * tsconfig.json is complete on its own because the Docker build sees only the
 * app's folder. This script keeps them from drifting apart.
 *
 * Plain Node without dependencies, so CI runs it without npm ci. Exits 1 and
 * lists every difference on stderr when anything differs.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

/**
 * Tools both apps install. An issue that brings a plugin into both apps adds
 * it here. Tools only one app uses, such as prettier-plugin-tailwindcss,
 * Stylelint and Storybook, are not compared.
 */
const SHARED_TOOLS = [
  'eslint',
  '@eslint/js',
  'typescript',
  'typescript-eslint',
  'prettier',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'eslint-plugin-simple-import-sort',
  'globals',
  'size-limit',
  '@size-limit/file',
  'husky',
  'lint-staged',
];

const APPS = ['frontend', 'dashboard'];
const ROOT = path.resolve(import.meta.dirname, '..');

function read(app, file) {
  return readFileSync(path.join(ROOT, app, file), 'utf8');
}

function readJson(app, file) {
  return JSON.parse(read(app, file));
}

function formatValue(value) {
  return value === undefined ? '(missing)' : JSON.stringify(value);
}

function compilerOptionDifferences() {
  const [frontend, dashboard] = APPS.map((app) => {
    const { paths: _paths, ...options } =
      readJson(app, 'tsconfig.json').compilerOptions ?? {};
    return options;
  });
  const keys = new Set([...Object.keys(frontend), ...Object.keys(dashboard)]);
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .filter((key) => !isDeepStrictEqual(frontend[key], dashboard[key]))
    .map((key) => ({
      what: `tsconfig.json compilerOptions.${key}`,
      frontend: frontend[key],
      dashboard: dashboard[key],
    }));
}

function toolVersionDifferences() {
  const [frontend, dashboard] = APPS.map((app) => {
    const pkg = readJson(app, 'package.json');
    return { ...pkg.dependencies, ...pkg.devDependencies };
  });
  return SHARED_TOOLS.filter(
    (tool) =>
      frontend[tool] === undefined ||
      dashboard[tool] === undefined ||
      frontend[tool] !== dashboard[tool],
  ).map((tool) => ({
    what: `package.json version of ${tool}`,
    frontend: frontend[tool],
    dashboard: dashboard[tool],
  }));
}

function nodeVersionDifferences() {
  const [frontend, dashboard] = APPS.map((app) => read(app, '.nvmrc').trim());
  return frontend === dashboard
    ? []
    : [{ what: '.nvmrc', frontend, dashboard }];
}

const differences = [
  ...compilerOptionDifferences(),
  ...toolVersionDifferences(),
  ...nodeVersionDifferences(),
];

if (differences.length > 0) {
  console.error(
    `Config parity check failed: ${differences.length} difference(s) between frontend/ and dashboard/.`,
  );
  for (const { what, frontend, dashboard } of differences) {
    console.error(
      `- ${what}: frontend ${formatValue(frontend)}, dashboard ${formatValue(dashboard)}`,
    );
  }
  process.exit(1);
}

console.log(
  'Config parity check passed: frontend/ and dashboard/ share compiler options, tool versions and Node version.',
);
