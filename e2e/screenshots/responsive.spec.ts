import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

import {
  DASHBOARD_URL,
  FORM_URL,
  pickFirstCategoryValue,
  signInAsStaff,
  waitForFormCategories,
} from '../tests/helpers';

const OUT_DIR = path.resolve(
  import.meta.dirname,
  '../../docs/screenshots/responsive',
);

function file(name: string, project: string): string {
  return path.join(OUT_DIR, `${name}-${project.split('-')[1] ?? project}.png`);
}

/**
 * The local database may hold Applications typed in by hand. Every name,
 * email and initials pair whose email is not an @example.org address is
 * replaced in the DOM before a screenshot is taken.
 */
async function maskRealApplicants(page: Page): Promise<void> {
  const people = await page.evaluate(async () => {
    const res = await fetch('/api/v1/staff/applications', {
      credentials: 'include',
    });
    const body = (await res.json()) as {
      applications: { name: string; email: string }[];
    };
    return body.applications
      .filter((a) => !a.email.toLowerCase().endsWith('@example.org'))
      .map((a) => ({ name: a.name, email: a.email }));
  });
  if (people.length === 0) return;

  await page.evaluate((list) => {
    const initialsOf = (name: string) => {
      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
      return (first + last).toUpperCase();
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      let text = node.textContent ?? '';
      for (const person of list) {
        text = text
          .split(person.name)
          .join('Maskierte Person')
          .split(person.email)
          .join('maskiert@example.org');
        if (text.trim() === initialsOf(person.name)) text = 'MP';
      }
      node.textContent = text;
    }
  }, people);
}

test('applicant form', async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  await page.goto(FORM_URL);
  const routeSelect = await waitForFormCategories(page);
  // Viewport shots: a full-page capture paints the sticky header in the
  // middle of the page.
  await page.screenshot({ path: file('formular-start', project) });

  await routeSelect.selectOption(await pickFirstCategoryValue(page));
  await page.getByLabel(/^Name/).fill('Mara Weber');
  await page.getByLabel(/^E-Mail/).fill('mara.weber@example.org');
  await page.getByLabel(/^Zeit pro Woche/).selectOption('HOURS_3_5');
  await page
    .getByLabel(/Erzähl uns kurz von dir/)
    .fill('Ich möchte gern in der Vereinsarbeit mithelfen.');
  await page.getByLabel(/^Name/).scrollIntoViewIfNeeded();
  // Leave room for the sticky header above the first field.
  await page.evaluate(() => window.scrollBy(0, -160));
  await page.screenshot({ path: file('formular-ausgefuellt', project) });
});

test('dashboard', async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  await signInAsStaff(page);

  await page.goto(`${DASHBOARD_URL}/#overview`);
  await expect(page.getByRole('heading', { name: /Willkommen,/ })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await maskRealApplicants(page);
  await page.screenshot({ path: file('dashboard-uebersicht', project), fullPage: true });

  await page.goto(`${DASHBOARD_URL}/#applications`);
  await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await maskRealApplicants(page);
  await page.screenshot({ path: file('dashboard-anfragen', project), fullPage: true });
});
