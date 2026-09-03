import axe, { type Result } from 'axe-core';

/**
 * Runs axe over a rendered container and fails with a readable report.
 *
 * axe-core is used directly rather than through a matcher package: the
 * published `vitest-axe` ships an empty `extend-expect` file, so its matcher
 * silently never registers.
 *
 * `color-contrast` is disabled because jsdom does not compute layout or
 * colour — the check would be meaningless here, not passing. Contrast stays on
 * the manual checklist in ../../README.md, together with visible focus and tap
 * target size.
 */
export async function expectNoA11yViolations(
  container: HTMLElement,
): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });

  if (violations.length === 0) return;

  throw new Error(
    `${String(violations.length)} accessibility violation(s):\n\n${violations
      .map(describe)
      .join('\n\n')}`,
  );
}

function describe(violation: Result): string {
  const nodes = violation.nodes.map((node) => `    ${node.html}`).join('\n');

  return [
    `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`,
    `  ${violation.helpUrl}`,
    nodes,
  ].join('\n');
}
