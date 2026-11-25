import { expect, type Locator, test } from '@playwright/test';

import { DASHBOARD_URL, signInAsStaff } from './helpers';

// Issue #207: at 320 px the three views of Anfragen are wider than the screen.
// The strip scrolls, and the edge hiding a tab fades out.

async function fadedEdges(strip: Locator) {
  return strip.evaluate((element) => {
    const mask = getComputedStyle(element).maskImage;

    return {
      start: mask.includes('to left'),
      end: mask.includes('to right'),
    };
  });
}

async function isWithin(inner: Locator, outer: Locator) {
  const [a, b] = await Promise.all([inner.boundingBox(), outer.boundingBox()]);

  if (!a || !b) return false;

  return a.x >= b.x - 0.5 && a.x + a.width <= b.x + b.width + 0.5;
}

test('a cut-off view tab fades out and shows whole once chosen', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-320',
    'Only 320 px is narrow enough to cut a tab off',
  );

  await signInAsStaff(page);
  await page.goto(`${DASHBOARD_URL}/#applications`);

  const strip = page.getByRole('tablist', { name: 'Anfragen' });
  const stale = strip.getByRole('tab', { name: /Lange offen/ });
  await expect(stale).toBeVisible();

  expect(await isWithin(stale, strip)).toBe(false);
  expect(await fadedEdges(strip)).toEqual({ start: false, end: true });

  // Click the visible sliver at the right edge, the way a person would;
  // `stale.click()` would scroll the tab into view first.
  const box = await strip.boundingBox();
  if (!box) throw new Error('tab strip has no box');
  await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2);

  await expect(stale).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => isWithin(stale, strip)).toBe(true);
  expect(await fadedEdges(strip)).toEqual({ start: true, end: false });

  await strip.getByRole('tab', { name: /Alle/ }).focus();
  await expect.poll(() => fadedEdges(strip)).toEqual({
    start: false,
    end: true,
  });
});
