import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const DASHBOARD_ROOT = new URL('../..', import.meta.url).pathname
  .replace(/^\/@fs/, '')
  .replace(/\/$/, '');

const RULE_ID = 'better-tailwindcss/no-restricted-classes';

const eslint = new ESLint({
  cwd: DASHBOARD_ROOT,
  overrideConfigFile: `${DASHBOARD_ROOT}/eslint.config.js`,
});

async function lintSnippet(
  code: string,
  filename = 'src/components/shared/PageHeader.tsx',
) {
  const [result] = await eslint.lintText(code, {
    filePath: `${DASHBOARD_ROOT}/${filename}`,
  });
  return (result?.messages ?? []).filter((m) => m.ruleId === RULE_ID);
}

const ARBITRARY_WIDTH = ['w', '[321px]'].join('-');
const ARBITRARY_BREAKPOINT = ['min', '[400px]:flex'].join('-');

describe(
  'better-tailwindcss/no-restricted-classes in dashboard/eslint.config.js',
  { timeout: 30_000 },
  () => {
    it('rejects arbitrary classes with digits in JSX className', async () => {
      const messages = await lintSnippet(
        `export function Sample() { return <div className="${ARBITRARY_WIDTH}" />; }`,
      );
      expect(messages.length).toBeGreaterThan(0);
    });

    it('rejects arbitrary breakpoint variants with digits', async () => {
      const messages = await lintSnippet(
        `export function Sample() { return <div className="${ARBITRARY_BREAKPOINT}" />; }`,
      );
      expect(messages.length).toBeGreaterThan(0);
    });

    it('rejects arbitrary classes with digits in exported string constants', async () => {
      const messages = await lintSnippet(
        `export const DRAWER_RESERVE = '${ARBITRARY_WIDTH}';`,
        'src/app/strip.ts',
      );
      expect(messages.length).toBeGreaterThan(0);
    });

    it('allows data-[...], transition-[...], var(--...), and inherit', async () => {
      const messages = await lintSnippet(
        `export function Sample() {
        return (
          <div className="data-[state=open]:block transition-[width] w-[var(--x)] rounded-[inherit]" />
        );
      }`,
      );
      expect(messages).toEqual([]);
    });
  },
);
