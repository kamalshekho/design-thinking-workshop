import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test, type TestInfo } from '@playwright/test';

import {
  DASHBOARD_URL,
  FORM_URL,
  pickFirstCategoryValue,
  signInAsStaff,
  waitForFormCategories,
} from './env';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function auditPage(
  page: Page,
  testInfo: TestInfo,
  label: string,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

  await testInfo.attach(`axe-${label}.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  const executedRuleIds = new Set([
    ...results.passes.map((rule) => rule.id),
    ...results.violations.map((rule) => rule.id),
    ...results.incomplete.map((rule) => rule.id),
    ...results.inapplicable.map((rule) => rule.id),
  ]);

  expect(
    executedRuleIds.has('color-contrast'),
    `[${label}] axe rule "color-contrast" must be executed`,
  ).toBe(true);
  expect(
    executedRuleIds.has('target-size'),
    `[${label}] axe rule "target-size" must be executed`,
  ).toBe(true);

  const summary = results.violations
    .map(
      (violation) =>
        `[${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}\n` +
        violation.nodes
          .map(
            (node) =>
              `  - ${node.target.join(' ')}\n    ${node.failureSummary ?? ''}`,
          )
          .join('\n'),
    )
    .join('\n\n');

  expect(results.violations, `[${label}] axe violations:\n${summary}`).toEqual(
    [],
  );

  // docs/STANDARD.md: no horizontal page overflow at any supported width (>= 320 px)
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scrollWidth,
    `[${label}] horizontal overflow (${String(overflow.scrollWidth)}px > ${String(overflow.clientWidth)}px)`,
  ).toBeLessThanOrEqual(overflow.clientWidth);
}

test('applicant form passes axe accessibility checks', async ({
  page,
}, testInfo) => {
  await page.goto(FORM_URL);
  const routeSelect = await waitForFormCategories(page);
  await auditPage(page, testInfo, 'form-initial');

  const categoryValue = await pickFirstCategoryValue(page);
  await routeSelect.selectOption(categoryValue);
  await expect(page.getByLabel(/^Name/)).toBeVisible();
  await auditPage(page, testInfo, 'form-fields');
});

test('dashboard screens pass axe accessibility checks', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'webkit-375',
    'WebKit on Linux does not send Secure cookies over http://localhost',
  );

  // Login screen (unauthenticated)
  await page.goto(DASHBOARD_URL);
  await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  await auditPage(page, testInfo, 'dashboard-login');

  // Sign in and audit all four screens. Reload into a fresh document after
  // signing in so React Aria's live-announcer from the unmounted login button
  // does not linger in the DOM.
  await signInAsStaff(page);
  await page.goto('about:blank');

  await page.goto(`${DASHBOARD_URL}/#overview`);
  await expect(
    page.getByRole('heading', { name: /Willkommen,/ }),
  ).toBeVisible();
  await auditPage(page, testInfo, 'dashboard-overview');

  await page.goto(`${DASHBOARD_URL}/#applications`);
  await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();
  await auditPage(page, testInfo, 'dashboard-applications');

  await page.goto(`${DASHBOARD_URL}/#categories`);
  await expect(page.getByRole('heading', { name: 'Kategorien' })).toBeVisible();
  await auditPage(page, testInfo, 'dashboard-categories');

  await page.goto(`${DASHBOARD_URL}/#discarded`);
  await expect(
    page.getByRole('heading', { name: 'Aussortierte Anfragen' }),
  ).toBeVisible();
  await auditPage(page, testInfo, 'dashboard-discarded');
});
