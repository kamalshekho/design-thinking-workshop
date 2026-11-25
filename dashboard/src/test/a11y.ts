import axe, { type Result, type RunOptions } from 'axe-core';

const AXE_RUN_OPTIONS: RunOptions = {
  rules: { 'color-contrast': { enabled: false } },
};

function formatViolation(violation: Result): string {
  const header = `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`;
  const link = `  ${violation.helpUrl}`;
  const targets = violation.nodes.map((node) => `    ${node.html}`);

  return [header, link, ...targets].join('\n');
}

/**
 * Runs axe over a rendered container and fails with a readable report.
 *
 * axe-core is used directly rather than through a matcher package: the
 * published `vitest-axe` ships an empty `extend-expect` file, so its matcher
 * silently never registers.
 *
 * `color-contrast` is disabled because jsdom does not compute layout or
 * colour — the check would be meaningless here, not passing. Contrast is
 * checked in a real browser instead.
 */
export async function expectNoA11yViolations(
  container: HTMLElement,
): Promise<void> {
  const results = await axe.run(container, AXE_RUN_OPTIONS);

  if (results.violations.length > 0) {
    const details = results.violations.map(formatViolation).join('\n\n');

    throw new Error(
      `${String(results.violations.length)} accessibility violation(s):\n\n${details}`,
    );
  }
}
