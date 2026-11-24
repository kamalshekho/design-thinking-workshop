import { expect, test } from '@playwright/test';

import {
  DASHBOARD_URL,
  FORM_URL,
  pickFirstCategoryValue,
  signInAsStaff,
  STAFF_NAME,
  waitForFormCategories,
} from './env';

test('A29: applicant submits application and staff takes ownership and updates status', async ({
  page,
}, testInfo) => {
  const uniqueId = `${testInfo.project.name}-${String(Date.now())}`;
  const applicantName = `E2E Applicant ${uniqueId}`;
  const applicantEmail = `e2e-${uniqueId}@example.org`;

  // 1. Applicant submits the form
  await page.goto(FORM_URL);
  const routeSelect = await waitForFormCategories(page);
  const categoryValue = await pickFirstCategoryValue(page);
  await routeSelect.selectOption(categoryValue);

  await page.getByLabel(/^Name/).fill(applicantName);
  await page.getByLabel(/^E-Mail/).fill(applicantEmail);
  await page.getByLabel(/^Zeit pro Woche/).selectOption('HOURS_3_5');
  await page
    .getByLabel(/Erzähl uns kurz von dir/)
    .fill('Ich möchte gern in der Vereinsarbeit mithelfen.');
  await page.getByRole('checkbox').check();

  await page.getByRole('button', { name: 'Bewerbung abschicken' }).click();

  await expect(
    page.getByRole('heading', { name: 'Deine Bewerbung ist da!' }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(applicantEmail)).toBeVisible();

  // WebKit on Linux does not send Secure cookies over http://localhost;
  // only the Applicant part runs in WebKit (issue #137 triage).
  if (testInfo.project.name === 'webkit-375') {
    return;
  }

  // 2. Staff member signs in and opens the submitted Application
  await signInAsStaff(page);
  await page.goto(`${DASHBOARD_URL}/#applications`);
  await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();

  const searchInput = page.getByRole('searchbox');
  await searchInput.fill(applicantEmail);

  const applicantEntry = page.getByText(applicantName).first();
  await expect(applicantEntry).toBeVisible({ timeout: 15_000 });
  await applicantEntry.click();

  const isNarrow = testInfo.project.name === 'chromium-320';

  if (isNarrow) {
    // Below 1024 px: ApplicationPage
    const detail = page.getByRole('region', { name: 'Anfrage' });
    await expect(detail).toBeVisible();

    const ownerPatch = page.waitForResponse(
      (res) =>
        res.request().method() === 'PATCH' &&
        res.url().includes('/api/v1/staff/applications/') &&
        res.ok(),
    );
    await detail.getByRole('button', { name: 'Übernehmen' }).click();
    await ownerPatch;
    await expect(detail.getByText('Du bist zuständig')).toBeVisible({
      timeout: 10_000,
    });

    const statusGroup = detail.getByRole('radiogroup', { name: 'Status' });
    const inReviewRadio = statusGroup.getByRole('radio', {
      name: 'In Prüfung',
    });
    const statusPatch = page.waitForResponse(
      (res) =>
        res.request().method() === 'PATCH' &&
        res.url().includes('/api/v1/staff/applications/') &&
        res.ok(),
    );
    await inReviewRadio.click();
    await statusPatch;
    await expect(inReviewRadio).toHaveAttribute('aria-checked', 'true', {
      timeout: 10_000,
    });

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();
    await page.getByRole('searchbox').fill(applicantEmail);
    await page.getByText(applicantName).first().click();

    const reloadedDetail = page.getByRole('region', { name: 'Anfrage' });
    await expect(reloadedDetail.getByText('Du bist zuständig')).toBeVisible();
    await expect(
      reloadedDetail
        .getByRole('radiogroup', { name: 'Status' })
        .getByRole('radio', { name: 'In Prüfung' }),
    ).toHaveAttribute('aria-checked', 'true');
  } else {
    // At 1280 px: ApplicationDrawer
    const drawer = page.getByRole('complementary', { name: 'Anfrage' });
    await expect(drawer).toBeVisible();

    const ownerTrigger = drawer.getByRole('button', { name: /Zuständig/ });
    const ownerPatch = page.waitForResponse(
      (res) =>
        res.request().method() === 'PATCH' &&
        res.url().includes('/api/v1/staff/applications/') &&
        res.ok(),
    );
    await ownerTrigger.click();
    await page.getByRole('option', { name: STAFF_NAME }).click();
    await ownerPatch;
    await expect(ownerTrigger).toContainText(STAFF_NAME, { timeout: 10_000 });

    const statusSelect = drawer.getByLabel('Status');
    const statusPatch = page.waitForResponse(
      (res) =>
        res.request().method() === 'PATCH' &&
        res.url().includes('/api/v1/staff/applications/') &&
        res.ok(),
    );
    await statusSelect.selectOption('IN_REVIEW');
    await statusPatch;
    await expect(statusSelect).toHaveValue('IN_REVIEW');

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Anfragen' })).toBeVisible();
    await page.getByRole('searchbox').fill(applicantEmail);
    await page.getByText(applicantName).first().click();

    const reloadedDrawer = page.getByRole('complementary', { name: 'Anfrage' });
    await expect(
      reloadedDrawer.getByRole('button', { name: /Zuständig/ }),
    ).toContainText(STAFF_NAME);
    await expect(reloadedDrawer.getByLabel('Status')).toHaveValue('IN_REVIEW');
  }
});
