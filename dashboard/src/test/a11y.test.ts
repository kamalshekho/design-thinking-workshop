import { afterEach, describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from './a11y';

/**
 * Guards the guard. An a11y check that cannot fail is worse than no check,
 * because it reports success. This test makes sure the helper still detects a
 * violation it is meant to catch.
 */
describe('expectNoA11yViolations', () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    container?.remove();
    container = null;
  });

  it('rejects a control with no accessible name', async () => {
    container = document.createElement('div');
    container.innerHTML = '<input type="email" />';
    document.body.append(container);

    await expect(expectNoA11yViolations(container)).rejects.toThrow(
      /accessibility violation/,
    );
  });

  it('accepts a labelled control', async () => {
    container = document.createElement('div');
    container.innerHTML =
      '<label for="a">E-Mail</label><input id="a" type="email" />';
    document.body.append(container);

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
